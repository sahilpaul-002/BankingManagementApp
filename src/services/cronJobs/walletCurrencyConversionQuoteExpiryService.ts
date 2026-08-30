import cron from "node-cron";
import mongoose, { Types } from "mongoose";
import { Decimal } from "decimal.js";
import { walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes } from "../../models/wallet_currency_conversion_quotes.js";
import { userWalletDetailsModel as user_wallet_details } from "../../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../../models/user_wallet_transaction_details.js";
import { AppErrorClass, ServiceError } from "../../utils/AppErrorClass.js";
import logger from "../../utils/logger.js";


// ----------------------------- EXPIRE WALLET CURRENCY CONVERSION QUOTE TRANSACTION ----------------------------- //
const expireWalletCurrencyConversionQuoteTransaction = async (quoteId: Types.ObjectId): Promise<void> => {

    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Get wallet currency conversion active / expired quotes
        const conversionQuote = await wallet_currency_conversion_quotes.findOne(
            {
                _id: quoteId,
                quote_status: {
                    $in: ["ACTIVE", "EXPIRED"],
                },
            }
        ).session(mongoSession);

        if (!conversionQuote) {
            // Quote may already be EXECUTED or otherwise processed.
            await mongoSession.abortTransaction();

            return;
        }

        // Validate expiry
        if (conversionQuote.expires_at.getTime() > Date.now()) {

            await mongoSession.abortTransaction();

            return;
        }

        // Check if the specified quotes has already failed
        const existingFailedTransaction = await user_wallet_transactions.findOne(
            {
                wallet_id: conversionQuote.wallet_id,
                cardholder_id: conversionQuote.cardholder_id,
                transaction_status: "FAILED",
                transaction_type: "WITHDRAW",
                reference_id: conversionQuote._id.toString(),
            }
        ).session(mongoSession);

        if (existingFailedTransaction) {
            logger.info(
                `Expired wallet currency conversion quote ${conversionQuote._id.toString()} ` +
                `has already been processed. Holding amount release skipped.`
            );

            await mongoSession.commitTransaction();

            return;
        }

        // Extract quote details
        const userId = conversionQuote.user_id;
        const cardholderId = conversionQuote.cardholder_id;
        const walletId = conversionQuote.wallet_id;
        const sourceCurrency = conversionQuote.source_currency;
        const sourceAmount = new Decimal(conversionQuote.source_amount?.toString() ?? "0");
        const destinationCurrency = conversionQuote.destination_currency;
        const destinationAmount = new Decimal(conversionQuote.destination_amount?.toString() ?? "0");
        const exchangeRate = new Decimal(conversionQuote.exchange_rate?.toString() ?? "0");
        const feeAmount = new Decimal(conversionQuote.fee_amount?.toString() ?? "0");

        // Validate source amount
        if (sourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid source amount in expired currency conversion quote");
        }

        // Get latest wallet details
        const walletDetails = await user_wallet_details.findOne(
            {
                _id: walletId,
                user_id: userId,
                cardholder_id: cardholderId,
            }
        ).session(mongoSession);

        if (!walletDetails) {
            throw new ServiceError("User wallet details not found for expired currency conversion quote");
        }

        // Find source wallet
        const sourceWalletIndex = walletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === "FIAT" &&
                wallet.wallet_currency === sourceCurrency &&
                wallet.wallet_status === "ACTIVE"
        );
        if (sourceWalletIndex === -1) {
            throw new ServiceError(`Active ${sourceCurrency} source wallet not found`);
        }

        const sourceWallet = walletDetails.wallets_details[sourceWalletIndex];
        if (!sourceWallet) {
            throw new ServiceError("Source wallet not found for expired currency conversion quote");
        }

        // Get current wallet balances
        const accountBalance = new Decimal(sourceWallet.account_balance?.toString() ?? "0");
        const availableBalance = new Decimal(sourceWallet.available_balance?.toString() ?? "0");
        const holdingAmount = new Decimal(sourceWallet.holding_amount?.toString() ?? "0");

        // Validate Wallet Balance
        if (!availableBalance.plus(holdingAmount).toDecimalPlaces(4).equals(accountBalance.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${sourceCurrency} wallet balance while ` + `releasing expired currency conversion quote`);
        }

        // Cehck holding balance contains the quote amount
        if (holdingAmount.lessThan(sourceAmount)) {
            throw new ServiceError(`Insufficient ${sourceCurrency} holding balance ` + `to release expired currency conversion quote`);
        }

        // Calculating new balances
        const newAvailableBalance = availableBalance.plus(sourceAmount).toDecimalPlaces(4);
        const newHoldingAmount = holdingAmount.minus(sourceAmount).toDecimalPlaces(4);

        // Final balance consistency check
        if (!newAvailableBalance.plus(newHoldingAmount).toDecimalPlaces(4).equals(accountBalance.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${sourceCurrency} wallet balance after ` + `releasing expired currency conversion quote`);
        }

        // Wallet Update
        const walletUpdateResult = await user_wallet_details.updateOne(
            {
                _id: walletDetails._id,
                user_id: userId,
                cardholder_id: cardholderId,

                wallets_details: {
                    $elemMatch: {
                        wallet_type: "FIAT",
                        wallet_currency: sourceCurrency,
                        wallet_status: "ACTIVE",

                        account_balance: sourceWallet.account_balance,
                        available_balance: sourceWallet.available_balance,
                        holding_amount: sourceWallet.holding_amount,
                    },
                },
            },
            {
                $set: {
                    [`wallets_details.${sourceWalletIndex}.available_balance`]:
                        mongoose.Types.Decimal128.fromString(
                            newAvailableBalance.toFixed(4)
                        ),

                    [`wallets_details.${sourceWalletIndex}.holding_amount`]:
                        mongoose.Types.Decimal128.fromString(
                            newHoldingAmount.toFixed(4)
                        ),
                },
            },
            {
                session: mongoSession,
            }
        );
        if (walletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Source wallet balance changed before expired " + "currency conversion quote could be released");
        }

        // Update the transaction status to failed
        const failedTransactionId = new Types.ObjectId();
        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderId,
                    wallet_id: walletDetails._id,
                    transaction_id: failedTransactionId,
                    transaction_type: "WITHDRAW",
                    transaction_status: "FAILED",
                    wallet_details: {
                        wallet_type: "FIAT",
                        wallet_currency: sourceCurrency,
                    },
                    amount: mongoose.Types.Decimal128.fromString(
                        sourceAmount.toFixed(4)
                    ),
                    balance_before: mongoose.Types.Decimal128.fromString(
                        accountBalance.toFixed(4)
                    ),
                    balance_after: mongoose.Types.Decimal128.fromString(
                        accountBalance.toFixed(4)
                    ),
                    reference_id: conversionQuote._id.toString(),
                    remarks: `Currency conversion quote expired. ` +
                        `Conversion from ${sourceCurrency} to ` +
                        `${destinationCurrency} failed. ` +
                        `Reserved amount ${sourceAmount.toFixed(4)} ` +
                        `${sourceCurrency} was released from holding. ` +
                        `Destination amount: ${destinationAmount.toFixed(4)} ` +
                        `${destinationCurrency}. ` +
                        `FX rate: ${exchangeRate.toFixed(8)}. ` +
                        `Fee: ${feeAmount.toFixed(4)} ${sourceCurrency}.`,
                },
            ],
            {
                session: mongoSession,
            }
        );

        // If quote is still ACTIVE, mark it EXPIRED.
        if (conversionQuote.quote_status === "ACTIVE") {
            const quoteUpdateResult = await wallet_currency_conversion_quotes.updateOne(
                {
                    _id: conversionQuote._id,
                    quote_status: "ACTIVE",
                },
                {
                    $set: {
                        quote_status: "EXPIRED",
                    },
                },
                {
                    session: mongoSession,
                }
            );
            if (quoteUpdateResult.modifiedCount !== 1) {
                throw new ServiceError("Currency conversion quote could not be marked as EXPIRED");
            }
        }

        // Commit transaction
        await mongoSession.commitTransaction();

        logger.info(`Wallet currency conversion quote ` +
            `${conversionQuote._id.toString()} processed successfully. ` +
            `${sourceAmount.toFixed(4)} ${sourceCurrency} ` +
            `released from holding balance. ` +
            `FAILED transaction created: ${failedTransactionId.toString()}`
        );

    }
    catch (err) {
        // Only abort if transaction is still active
        if (
            mongoSession.inTransaction()
        ) {
            await mongoSession.abortTransaction();
        }

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ExpireWalletCurrencyConversionQuoteTransaction",
                quoteId: quoteId.toString(),
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`ExpireWalletCurrencyConversionQuoteTransaction facing issue: ${error.message}`,
            error?.error
                ? error.error
                : error
        );
    }
    finally {

        await mongoSession.endSession();

    }
};
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ----------------------------- EXPIRE WALLET CURRENCY CONVERSION QUOTES SERVICE ----------------------------- //
export const expireWalletCurrencyConversionQuotesService = async (): Promise<void> => {
    try {

        const currentDate = new Date();

        // Get Active/Expired Quotes
        const expiredQuotes = await wallet_currency_conversion_quotes.find(
            {
                quote_status: {
                    $in: ["ACTIVE", "EXPIRED"],
                },
                expires_at: {
                    $lte: currentDate,
                },
            },
            {
                _id: 1,
            }
        ).lean();
        if (expiredQuotes.length === 0) {
            logger.info("Expired wallet currency conversion quote cron job completed. " + "No expired ACTIVE or EXPIRED conversion quotes found.");

            return;
        }

        let successfullyProcessedCount = 0;
        let failedCount = 0;

        // --------------------------------------------------
        // Process each quote separately.
        //
        // Each quote gets its own MongoDB transaction.
        // --------------------------------------------------
        for (const quote of expiredQuotes) {
            try {
                await expireWalletCurrencyConversionQuoteTransaction(quote._id);

                successfullyProcessedCount++;
            }
            catch (err) {
                failedCount++;

                const error = err as any;

                logger.error(
                    error,
                    {
                        serviceName: "ExpireWalletCurrencyConversionQuotesService",
                        quoteId: quote._id.toString(),
                    }
                );
            }
        }

        logger.info(`Expired wallet currency conversion quote cron job completed. ` +
            `${successfullyProcessedCount} quote(s) processed successfully. ` +
            `${failedCount} quote(s) failed.`
        );

    }
    catch (err) {
        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ExpireWalletCurrencyConversionQuotesService failed to find expired quotes",
            }
        );
    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\



// ----------------------------- WALLET CURRENCY CONVERSION QUOTE EXPIRY CRON JOB ----------------------------- //
export const startWalletCurrencyConversionQuoteExpiryCronJob = (): void => {
        /*
            Cron expression:

            "* * * * *"

            Means:
            - Run every 1 minute
            - Find ACTIVE or EXPIRED conversion quotes
            - Check expires_at <= current time
            - Release source amount from holding_amount
            - Move it back to available_balance
            - Keep account_balance unchanged
            - Create a FAILED wallet transaction
            - If quote is ACTIVE, mark it EXPIRED
            - If quote is already EXPIRED, leave it EXPIRED
        */

        cron.schedule("* * * * *", async () => {

            logger.info("Expired wallet currency conversion quote cron job started.");

            await expireWalletCurrencyConversionQuotesService();

        });

        logger.info("Wallet currency conversion quote expiry cron job initialized successfully.");
    };