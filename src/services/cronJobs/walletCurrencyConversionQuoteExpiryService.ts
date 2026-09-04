import cron from "node-cron";
import mongoose, { Types } from "mongoose";
import { Decimal } from "decimal.js";
import {
    walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes
} from "../../models/wallet_currency_conversion_quotes.js";
import {
    userWalletDetailsModel as user_wallet_details
} from "../../models/user_wallet_details.js";
import {
    userWalletTransactionsModel as user_wallet_transactions
} from "../../models/user_wallet_transaction_details.js";
import { AppErrorClass, ServiceError } from "../../utils/AppErrorClass.js";
import logger from "../../utils/logger.js";


// ----------------------------- EXPIRE WALLET CURRENCY CONVERSION QUOTE TRANSACTION ----------------------------- //
const expireWalletCurrencyConversionQuoteTransaction = async (
    quoteId: Types.ObjectId
): Promise<void> => {

    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // --------------------------------------------------
        // 1. Get ACTIVE / EXPIRED quote
        // --------------------------------------------------
        const conversionQuote = await wallet_currency_conversion_quotes.findOne(
            {
                _id: quoteId,
                quote_status: {
                    $in: ["ACTIVE", "EXPIRED"],
                },
            }
        ).session(mongoSession);

        if (!conversionQuote) {
            // Quote may already be EXECUTED or already processed.
            await mongoSession.abortTransaction();
            return;
        }

        // --------------------------------------------------
        // 2. Validate quote expiry
        // --------------------------------------------------
        if (conversionQuote.expires_at.getTime() > Date.now()) {
            await mongoSession.abortTransaction();
            return;
        }

        // --------------------------------------------------
        // 3. Get conversion reference ID
        //
        // IMPORTANT:
        // The quote and HOLD transaction use the same
        // conversion_reference_id.
        // --------------------------------------------------
        const conversionReferenceId =
            conversionQuote.conversion_reference_id;

        if (!conversionReferenceId) {
            throw new ServiceError(
                "Currency conversion reference ID not found in expired quote"
            );
        }

        // --------------------------------------------------
        // 4. Check whether the HOLD transaction still exists
        //
        // The source HOLD transaction was created when
        // the quote was created.
        //
        // We must update that transaction instead of
        // creating another FAILED transaction.
        // --------------------------------------------------
        const sourceHoldTransaction =
            await user_wallet_transactions.findOne(
                {
                    wallet_id: conversionQuote.wallet_id,
                    cardholder_id: conversionQuote.cardholder_id,

                    transaction_type: "HOLD",
                    transaction_status: "PENDING",

                    reference_id: conversionReferenceId as string,
                }
            ).session(mongoSession);

        if (!sourceHoldTransaction) {

            // --------------------------------------------------
            // If HOLD no longer exists, the quote may have already
            // been processed by execution or another process.
            // --------------------------------------------------
            logger.info(
                `No pending HOLD transaction found for expired ` +
                `wallet currency conversion quote ` +
                `${conversionQuote._id.toString()}. ` +
                `Reference ID: ${conversionReferenceId}`
            );

            // If quote is still ACTIVE, mark it EXPIRED.
            if (conversionQuote.quote_status === "ACTIVE") {

                const quoteUpdateResult =
                    await wallet_currency_conversion_quotes.updateOne(
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
                    throw new ServiceError(
                        "Currency conversion quote could not be marked as EXPIRED"
                    );
                }
            }

            await mongoSession.commitTransaction();

            return;
        }

        // --------------------------------------------------
        // 5. Extract quote details
        // --------------------------------------------------
        const userId = conversionQuote.user_id;
        const cardholderId = conversionQuote.cardholder_id;
        const walletId = conversionQuote.wallet_id;

        const sourceCurrency = conversionQuote.source_currency;
        const destinationCurrency =
            conversionQuote.destination_currency;

        const sourceAmount = new Decimal(
            conversionQuote.source_amount?.toString() ?? "0"
        );

        const destinationAmount = new Decimal(
            conversionQuote.destination_amount?.toString() ?? "0"
        );

        const exchangeRate = new Decimal(
            conversionQuote.exchange_rate?.toString() ?? "0"
        );

        const feeAmount = new Decimal(
            conversionQuote.fee_amount?.toString() ?? "0"
        );

        // --------------------------------------------------
        // 6. Validate source amount
        // --------------------------------------------------
        if (sourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError(
                "Invalid source amount in expired currency conversion quote"
            );
        }

        // --------------------------------------------------
        // 7. Determine source wallet type
        //
        // CHANGED:
        // Previously this cron assumed FIAT.
        //
        // Conversion also supports:
        // USDC / USDT -> CRYPTO
        // USD / EUR / SGD -> FIAT
        // --------------------------------------------------
        const cryptoCurrencies = ["USDC", "USDT"];

        const sourceWalletType = cryptoCurrencies.includes(sourceCurrency)
            ? "CRYPTO"
            : "FIAT";

        // --------------------------------------------------
        // 8. Get latest wallet details
        // --------------------------------------------------
        const walletDetails = await user_wallet_details.findOne(
            {
                _id: walletId,
                user_id: userId,
                cardholder_id: cardholderId,
            }
        ).session(mongoSession).lean();

        if (!walletDetails) {
            throw new ServiceError(
                "User wallet details not found for expired currency conversion quote"
            );
        }

        // --------------------------------------------------
        // 9. Find source wallet
        // --------------------------------------------------
        const sourceWalletIndex =
            walletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === sourceWalletType &&
                    wallet.wallet_currency === sourceCurrency &&
                    wallet.wallet_status === "ACTIVE"
            );

        if (sourceWalletIndex === -1) {
            throw new ServiceError(
                `Active ${sourceCurrency} source wallet not found`
            );
        }

        const sourceWallet =
            walletDetails.wallets_details[sourceWalletIndex];

        if (!sourceWallet) {
            throw new ServiceError(
                "Source wallet not found for expired currency conversion quote"
            );
        }

        // --------------------------------------------------
        // 10. Get current wallet balances
        // --------------------------------------------------
        const accountBalance = new Decimal(
            sourceWallet.account_balance?.toString() ?? "0"
        );

        const availableBalance = new Decimal(
            sourceWallet.available_balance?.toString() ?? "0"
        );

        const holdingAmount = new Decimal(
            sourceWallet.holding_amount?.toString() ?? "0"
        );

        // --------------------------------------------------
        // 11. Validate wallet balance consistency
        // --------------------------------------------------
        if (
            !availableBalance
                .plus(holdingAmount)
                .toDecimalPlaces(4)
                .equals(accountBalance.toDecimalPlaces(4))
        ) {
            throw new ServiceError(
                `Invalid ${sourceCurrency} wallet balance while ` +
                `releasing expired currency conversion quote`
            );
        }

        // --------------------------------------------------
        // 12. Make sure holding contains the quote amount
        // --------------------------------------------------
        if (holdingAmount.lessThan(sourceAmount)) {
            throw new ServiceError(
                `Insufficient ${sourceCurrency} holding balance ` +
                `to release expired currency conversion quote`
            );
        }

        // --------------------------------------------------
        // 13. Calculate released balances
        // --------------------------------------------------
        const newAvailableBalance = availableBalance
            .plus(sourceAmount)
            .toDecimalPlaces(4);

        const newHoldingAmount = holdingAmount
            .minus(sourceAmount)
            .toDecimalPlaces(4);

        // --------------------------------------------------
        // 14. Final balance consistency check
        // --------------------------------------------------
        if (
            !newAvailableBalance
                .plus(newHoldingAmount)
                .toDecimalPlaces(4)
                .equals(accountBalance.toDecimalPlaces(4))
        ) {
            throw new ServiceError(
                `Invalid ${sourceCurrency} wallet balance after ` +
                `releasing expired currency conversion quote`
            );
        }

        // --------------------------------------------------
        // 15. Atomic wallet update
        // --------------------------------------------------
        const walletUpdateResult =
            await user_wallet_details.updateOne(
                {
                    _id: walletDetails._id,
                    user_id: userId,
                    cardholder_id: cardholderId,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type: sourceWalletType,
                            wallet_currency: sourceCurrency,
                            wallet_status: "ACTIVE",

                            account_balance:
                                sourceWallet.account_balance,

                            available_balance:
                                sourceWallet.available_balance,

                            holding_amount:
                                sourceWallet.holding_amount,
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
            throw new ServiceError(
                "Source wallet balance changed before expired " +
                "currency conversion quote could be released"
            );
        }

        // --------------------------------------------------
        // 16. UPDATE EXISTING HOLD TRANSACTION
        //
        // CHANGED:
        //
        // DO NOT create a new FAILED transaction.
        //
        // Existing:
        //     HOLD / PENDING
        //
        // Becomes:
        //     RELEASE / SUCCESS
        //
        // The amount is the amount that was originally held.
        // --------------------------------------------------
        const releaseTransaction =
            await user_wallet_transactions.findOneAndUpdate(
                {
                    _id: sourceHoldTransaction._id,

                    transaction_type: "HOLD",
                    transaction_status: "PENDING",

                    reference_id: conversionReferenceId as string,

                    wallet_id: walletDetails._id,
                    cardholder_id: cardholderId,
                },
                {
                    $set: {
                        transaction_type: "RELEASE",
                        transaction_status: "SUCCESS",

                        fee: mongoose.Types.Decimal128.fromString("0"),

                        // Account balance does not change during
                        // HOLD -> RELEASE.
                        balance_before:
                            mongoose.Types.Decimal128.fromString(
                                accountBalance.toFixed(4)
                            ),

                        balance_after:
                            mongoose.Types.Decimal128.fromString(
                                accountBalance.toFixed(4)
                            ),

                        remarks:
                            `Currency conversion quote expired. ` +
                            `${sourceAmount.toFixed(4)} ${sourceCurrency} ` +
                            `released from holding balance and ` +
                            `returned to available balance. ` +
                            `Conversion to ${destinationCurrency} was not executed.`,
                    },
                },
                {
                    session: mongoSession,
                    new: true,
                }
            );

        if (!releaseTransaction) {
            throw new ServiceError(
                "Source wallet HOLD transaction could not be updated to RELEASE"
            );
        }

        // --------------------------------------------------
        // 17. Mark quote as EXPIRED
        //
        // Whether it was ACTIVE or already EXPIRED, the
        // final state remains EXPIRED.
        // --------------------------------------------------
        const quoteUpdateResult =
            await wallet_currency_conversion_quotes.updateOne(
                {
                    _id: conversionQuote._id,

                    quote_status: {
                        $in: ["ACTIVE", "EXPIRED"],
                    },
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
            throw new ServiceError(
                "Currency conversion quote could not be marked as EXPIRED"
            );
        }

        // --------------------------------------------------
        // 18. Commit transaction
        // --------------------------------------------------
        await mongoSession.commitTransaction();

        logger.info(
            `Wallet currency conversion quote ` +
            `${conversionQuote._id.toString()} processed successfully. ` +
            `${sourceAmount.toFixed(4)} ${sourceCurrency} ` +
            `released from holding balance. ` +
            `HOLD transaction ${sourceHoldTransaction.transaction_id.toString()} ` +
            `updated to RELEASE.`
        );
    }
    catch (err) {

        if (mongoSession.inTransaction()) {
            await mongoSession.abortTransaction();
        }

        const error = err as any;

        logger.error(
            error,
            {
                serviceName:
                    "ExpireWalletCurrencyConversionQuoteTransaction",

                quoteId: quoteId.toString(),
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `ExpireWalletCurrencyConversionQuoteTransaction facing issue: ${error.message}`,
            error?.error ? error.error : error
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

        const expiredQuotes =
            await wallet_currency_conversion_quotes.find(
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

            logger.info(
                "Expired wallet currency conversion quote cron job completed. " +
                "No expired ACTIVE or EXPIRED conversion quotes found."
            );

            return;
        }

        let successfullyProcessedCount = 0;
        let failedCount = 0;

        for (const quote of expiredQuotes) {

            try {

                await expireWalletCurrencyConversionQuoteTransaction(
                    quote._id
                );

                successfullyProcessedCount++;

            }
            catch (err) {

                failedCount++;

                const error = err as any;

                logger.error(
                    error,
                    {
                        serviceName:
                            "ExpireWalletCurrencyConversionQuotesService",

                        quoteId: quote._id.toString(),
                    }
                );
            }
        }

        logger.info(
            `Expired wallet currency conversion quote cron job completed. ` +
            `${successfullyProcessedCount} quote(s) processed successfully. ` +
            `${failedCount} quote(s) failed.`
        );

    }
    catch (err) {

        const error = err as any;

        logger.error(
            error,
            {
                serviceName:
                    "ExpireWalletCurrencyConversionQuotesService failed to find expired quotes",
            }
        );
    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- //


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
        - Update existing HOLD transaction to RELEASE
        - Mark quote as EXPIRED
    */

    cron.schedule("* * * * *", async () => {

        try {

            logger.info(
                "Expired wallet currency conversion quote cron job started.",
                {
                    serviceName:
                        "ExpireWalletCurrencyConversionQuotesCronJob",
                }
            );

            await expireWalletCurrencyConversionQuotesService();

            logger.info(
                "Expired wallet currency conversion quote cron job completed.",
                {
                    serviceName:
                        "ExpireWalletCurrencyConversionQuotesCronJob",
                }
            );

        }
        catch (err: any) {

            logger.error(
                err,
                {
                    serviceName:
                        "ExpireWalletCurrencyConversionQuotesCronJob",

                    message:
                        "Unexpected error in wallet currency conversion quote expiry cron job",
                }
            );
        }
    });

    logger.info(
        "Wallet currency conversion quote expiry cron job initialized successfully."
    );
};