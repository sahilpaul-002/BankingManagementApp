import type { Types } from "mongoose";
import mongoose from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { AppErrorClass, NotFoundError, ServiceError } from "../utils/AppErrorClass.js";
import { Decimal } from "decimal.js";
import { walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes } from "../models/wallet_currency_conversion_quotes.js";
import logger from "../utils/logger.js";

const expiredWalletCurrencyConversionQuoteTransaction = async (quoteId: Types.ObjectId): Promise<void> => {

    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Get ACTIVE / EXPIRED quote
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

        // Validate quote expiry
        if (conversionQuote.expires_at.getTime() > Date.now()) {
            await mongoSession.abortTransaction();
            return;
        }

        // Get conversion reference ID. The quote and hold transaction use the same conversion_reference_id
        const conversionReferenceId =
            conversionQuote.conversion_reference_id;
        if (!conversionReferenceId) {
            throw new NotFoundError("Currency conversion reference ID not found in expired quote");
        }

        // Get the source wallet hold transaction
        const sourceHoldTransaction = await user_wallet_transactions.findOne(
            {
                wallet_id: conversionQuote.wallet_id,
                cardholder_id: conversionQuote.cardholder_id,
                transaction_type: "HOLD",
                transaction_status: "PENDING",
                reference_id: conversionReferenceId as string,
            }
        ).session(mongoSession);
        if (!sourceHoldTransaction) {
            logger.info(
                `No pending HOLD transaction found for expired ` +
                `wallet currency conversion quote ` +
                `${conversionQuote._id.toString()}. ` +
                `Reference ID: ${conversionReferenceId}`
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
                    throw new ServiceError("Currency conversion quote failed to be marked as EXPIRED");
                }
            }

            await mongoSession.commitTransaction();

            return;
        }

        // Extract quote details
        const userId = conversionQuote.user_id;
        const cardholderId = conversionQuote.cardholder_id;
        const walletId = conversionQuote.wallet_id;
        const sourceCurrency = conversionQuote.source_currency;
        const destinationCurrency = conversionQuote.destination_currency;
        const sourceAmount = new Decimal(conversionQuote.source_amount?.toString() ?? "0");
        const destinationAmount = new Decimal(conversionQuote.destination_amount?.toString() ?? "0");
        const exchangeRate = new Decimal(conversionQuote.exchange_rate?.toString() ?? "0");
        const feeAmount = new Decimal(conversionQuote.fee_amount?.toString() ?? "0");

        // Validate source amount
        if (sourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid source amount in expired currency conversion quote");
        }

        // Determine Source Wallet
        const cryptoCurrencies = ["USDC", "USDT"];
        const sourceWalletType = cryptoCurrencies.includes(sourceCurrency) ? "CRYPTO" : "FIAT";

        // Get latest wallet details
        const walletDetails = await user_wallet_details.findOne(
            {
                _id: walletId,
                user_id: userId,
                cardholder_id: cardholderId,
            }
        ).session(mongoSession).lean();
        if (!walletDetails) {
            throw new ServiceError("User wallet details not found for expired currency conversion quote");
        }

        // Fetch source wallet
        const sourceWalletIndex = walletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === sourceWalletType &&
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

        // Validate wallet balance consistency
        if (!availableBalance.plus(holdingAmount).toDecimalPlaces(4).equals(accountBalance.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${sourceCurrency} wallet balance while ` + `releasing expired currency conversion quote`);
        }
        if (holdingAmount.lessThan(sourceAmount)) {
            throw new ServiceError(`Insufficient ${sourceCurrency} holding balance ` + `to release expired currency conversion quote`);
        }

        // Calculate released balances
        const newAvailableBalance = availableBalance.plus(sourceAmount).toDecimalPlaces(4);
        const newHoldingAmount = holdingAmount.minus(sourceAmount).toDecimalPlaces(4);

        // Final balance consistency check
        if (!newAvailableBalance.plus(newHoldingAmount).toDecimalPlaces(4).equals(accountBalance.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${sourceCurrency} wallet balance after ` + `releasing expired currency conversion quote`);
        }

        // Atomic wallet update
        const walletUpdateResult = await user_wallet_details.updateOne(
            {
                _id: walletDetails._id,
                user_id: userId,
                cardholder_id: cardholderId,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: sourceWalletType,
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
                    [`wallets_details.${sourceWalletIndex}.available_balance`]: mongoose.Types.Decimal128.fromString(newAvailableBalance.toFixed(4)),
                    [`wallets_details.${sourceWalletIndex}.holding_amount`]: mongoose.Types.Decimal128.fromString(newHoldingAmount.toFixed(4)),
                },
            },
            {
                session: mongoSession,
            }
        );
        if (walletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Source wallet balance changed before expired " + "currency conversion quote could be released"
            );
        }

        // Update existing hold source wallet transantion
        const releaseTransaction = await user_wallet_transactions.findOneAndUpdate(
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
                    balance_before: mongoose.Types.Decimal128.fromString(accountBalance.toFixed(4)),
                    balance_after: mongoose.Types.Decimal128.fromString(accountBalance.toFixed(4)),
                    remarks: `Currency conversion quote expired. ` +
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
            throw new ServiceError("Source wallet HOLD transaction could not be updated to RELEASE");
        }

        // Mark quote as EXPIRED
        const quoteUpdateResult = await wallet_currency_conversion_quotes.updateOne(
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
            throw new ServiceError("Currency conversion quote could not be marked as EXPIRED");
        }

        // Commit transaction
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
                serviceName: "ExpireWalletCurrencyConversionQuoteTransaction",
                quoteId: quoteId.toString(),
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`ExpireWalletCurrencyConversionQuoteTransaction facing issue: ${error.message}`, error?.error ? error.error : error);
    }
    finally {
        await mongoSession.endSession();
    }
};

export default expiredWalletCurrencyConversionQuoteTransaction;