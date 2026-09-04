import mongoose, { Types } from "mongoose";
import { Decimal } from "decimal.js";
import { userWalletDetailsModel as user_wallet_details, } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions, } from "../models/user_wallet_transaction_details.js";
import { walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes, } from "../models/wallet_currency_conversion_quotes.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import type { walletCurrencyConversionQuoteSchemaTypes, walletDetailsType } from "../types/schemaTypes.js";
import crypto from "crypto";
import sanitizeApiError from "../utils/sanitizeApiError.js";

interface WalletCurrencyConversionType {
    conversionQuote: walletCurrencyConversionQuoteSchemaTypes;
    userId: mongoose.Types.ObjectId;
    cardholderId: mongoose.Types.ObjectId;
    walletId: mongoose.Types.ObjectId;
}


const executeWalletCurrencyConversionTransaction = async ({
    conversionQuote,
    userId,
    cardholderId,
    walletId
}: WalletCurrencyConversionType) => {

    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        // Extract quote details
        const sourceCurrency = conversionQuote.source_currency;
        const destinationCurrency = conversionQuote.destination_currency;

        // Convert quote amounts to Decimal.js
        const sourceAmount = new Decimal(conversionQuote.source_amount?.toString() ?? "0");
        const destinationAmount = new Decimal(conversionQuote.destination_amount?.toString() ?? "0");

        const feeAmount = new Decimal(conversionQuote.fee_amount?.toString() ?? "0");
        const exchangeRate = new Decimal(conversionQuote.exchange_rate?.toString() ?? "0");

        // Validate quote amounts
        if (sourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid source conversion amount");
        }
        if (destinationAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid destination conversion amount");
        }
        if (exchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid conversion exchange rate");
        }
        if (feeAmount.isNegative()) {
            throw new ServiceError("Invalid conversion fee");
        }

        // Get the conversion reference id
        const conversionReferenceId = conversionQuote.conversion_reference_id;
        if (!conversionReferenceId) {
            throw new ServiceError("Currency conversion reference ID not found in quote");
        }

        // --------------------------------------------------
        // Fetch latest wallet document
        //
        // We do this inside the transaction so execution
        // does not depend only on the wallet snapshot
        // obtained by the execute service.
        // --------------------------------------------------
        const walletDetails = await user_wallet_details.findOne(
            {
                _id: walletId,
                user_id: userId,
                cardholder_id: cardholderId,
            }
        ).session(mongoSession);
        if (!walletDetails) {
            throw new ServiceError("User wallet details not found");
        }

        // Find latest source wallet
        const cryptoCurrencies = ["USDC", "USDT"];
        const sourceWalletType = cryptoCurrencies.includes(sourceCurrency) ? "CRYPTO" : "FIAT";
        const destinationWalletType = cryptoCurrencies.includes(destinationCurrency) ? "CRYPTO" : "FIAT";
        const sourceWalletIndex = walletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === sourceWalletType &&
                wallet.wallet_currency === sourceCurrency &&
                wallet.wallet_status === "ACTIVE"
        );
        if (sourceWalletIndex === -1) {
            throw new ServiceError(`Active ${sourceCurrency} source wallet not found`);
        }

        // Find latest destination wallet
        const destinationWalletIndex = walletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === destinationWalletType &&
                wallet.wallet_currency === destinationCurrency &&
                wallet.wallet_status === "ACTIVE"
        );
        if (destinationWalletIndex === -1) {
            throw new ServiceError(
                `Active ${destinationCurrency} destination wallet not found`
            );
        }


        // Prevent accidental same wallet conversion
        if (sourceWalletIndex === destinationWalletIndex) {
            throw new ServiceError("Source and destination wallets cannot be the same");
        }

        //  Get latest wallet objects
        const latestSourceWallet = walletDetails.wallets_details[sourceWalletIndex];
        const latestDestinationWallet = walletDetails.wallets_details[destinationWalletIndex];
        if (!latestSourceWallet) {
            throw new ServiceError("Latest source wallet not found");
        }
        if (!latestDestinationWallet) {
            throw new ServiceError("Latest destination wallet not found");
        }

        // Get current source balance / holding balance
        const sourceBalance = new Decimal(latestSourceWallet.account_balance?.toString() ?? "0");
        const sourceAvailableBalance = new Decimal(latestSourceWallet.available_balance?.toString() ?? "0");
        const sourceHoldingAmount = new Decimal(latestSourceWallet.holding_amount?.toString() ?? "0");
        if (!sourceAvailableBalance.plus(sourceHoldingAmount).toDecimalPlaces(4).equals(sourceBalance.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${sourceCurrency} wallet balance`);
        }
        if (sourceHoldingAmount.lessThan(sourceAmount)) {
            throw new ServiceError(`Insufficient ${sourceCurrency} holding balance for currency conversion`);
        }

        // Calculate new balances
        const newSourceBalance = sourceBalance.minus(sourceAmount).toDecimalPlaces(4);
        const newSourceAvailableBalance = sourceAvailableBalance.toDecimalPlaces(4);
        const newSourceHoldingAmount = sourceHoldingAmount.minus(sourceAmount).toDecimalPlaces(4);

        // Get destination balance
        const destinationBalance = new Decimal(latestDestinationWallet.account_balance?.toString() ?? "0");
        const destinationAvailableBalance = new Decimal(latestDestinationWallet.available_balance?.toString() ?? "0");
        const destinationHoldingAmount = new Decimal(latestDestinationWallet.holding_amount?.toString() ?? "0");
        const newDestinationBalance = destinationBalance.plus(destinationAmount).toDecimalPlaces(4);
        const newDestinationAvailableBalance = destinationAvailableBalance.plus(destinationAmount).toDecimalPlaces(4);

        // TRANSACTION LIMIT
        const sourceAmountDecimal128 = mongoose.Types.Decimal128.fromString(sourceAmount.toDecimalPlaces(4).toString());
        const destinationAmountDecimal128 = mongoose.Types.Decimal128.fromString(destinationAmount.toDecimalPlaces(4).toString());
        const now = new Date();
        const sourceUpdateInc: Record<string, mongoose.Types.Decimal128> = {};
        const sourceUpdateSet: Record<string, any> = {};
        const destinationUpdateInc: Record<string, mongoose.Types.Decimal128> = {};
        const destinationUpdateSet: Record<string, any> = {};

        // SOURCE WALLET - DEBIT
        const sourceDaily = latestSourceWallet.daily_transaction;
        if (!sourceDaily?.date || sourceDaily.date.toDateString() !== now.toDateString()) {
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.daily_transaction.debit`] = sourceAmountDecimal128;
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.daily_transaction.date`] = now;
        }
        else {
            sourceUpdateInc[`wallets_details.${sourceWalletIndex}.daily_transaction.debit`] = sourceAmountDecimal128;
        }
        // Source Monthly Debit
        const isSourceSameMonth = latestSourceWallet.monthly_transaction?.month === now.getMonth() + 1 && latestSourceWallet.monthly_transaction?.year === now.getFullYear();
        if (isSourceSameMonth) {
            sourceUpdateInc[`wallets_details.${sourceWalletIndex}.monthly_transaction.debit`] = sourceAmountDecimal128;
        }
        else {
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.monthly_transaction.debit`] = sourceAmountDecimal128;
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.monthly_transaction.month`] = now.getMonth() + 1;
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.monthly_transaction.year`] = now.getFullYear();
        }
        // Source Yearly Debit
        const isSourceSameYear = latestSourceWallet.yearly_transaction?.year === now.getFullYear();
        if (isSourceSameYear) {
            sourceUpdateInc[`wallets_details.${sourceWalletIndex}.yearly_transaction.debit`] = sourceAmountDecimal128;
        }
        else {
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.yearly_transaction.debit`] = sourceAmountDecimal128;
            sourceUpdateSet[`wallets_details.${sourceWalletIndex}.yearly_transaction.year`] = now.getFullYear();
        }

        // DESTINATION WALLET - CREDIT
        const destinationDaily = latestDestinationWallet.daily_transaction;
        if (!destinationDaily?.date || destinationDaily.date.toDateString() !== now.toDateString()
        ) {
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.daily_transaction.credit`] = destinationAmountDecimal128;
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.daily_transaction.date`] = now;
        }
        else {
            destinationUpdateInc[`wallets_details.${destinationWalletIndex}.daily_transaction.credit`] = destinationAmountDecimal128;
        }

        // Destination Monthly Credit
        const isDestinationSameMonth = latestDestinationWallet.monthly_transaction?.month === now.getMonth() + 1 && latestDestinationWallet.monthly_transaction?.year === now.getFullYear();
        if (isDestinationSameMonth) {
            destinationUpdateInc[`wallets_details.${destinationWalletIndex}.monthly_transaction.credit`] = destinationAmountDecimal128;
        }
        else {
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.monthly_transaction.credit`] = destinationAmountDecimal128;
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.monthly_transaction.month`] = now.getMonth() + 1;
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.monthly_transaction.year`] = now.getFullYear();
        }
        // Destination Yearly Credit
        const isDestinationSameYear = latestDestinationWallet.yearly_transaction?.year === now.getFullYear();
        if (isDestinationSameYear) {
            destinationUpdateInc[`wallets_details.${destinationWalletIndex}.yearly_transaction.credit`] = destinationAmountDecimal128;
        }
        else {
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.yearly_transaction.credit`] = destinationAmountDecimal128;
            destinationUpdateSet[`wallets_details.${destinationWalletIndex}.yearly_transaction.year`] = now.getFullYear();
        }

        // --------------------------------------------------
        // Source wallet atomic update
        //
        // The old balance is included in the query.
        //
        // Therefore another transaction cannot overwrite
        // a newer balance.
        // --------------------------------------------------
        const sourceWalletUpdateResult = await user_wallet_details.updateOne(
            {
                _id: walletDetails._id,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: sourceWalletType,
                        wallet_currency: sourceCurrency,
                        wallet_status: "ACTIVE",
                        account_balance: latestSourceWallet.account_balance,
                        available_balance: latestSourceWallet.available_balance,
                        holding_amount: latestSourceWallet.holding_amount,
                    },
                },
            },
            {
                $set: {
                    [`wallets_details.${sourceWalletIndex}.account_balance`]: mongoose.Types.Decimal128.fromString(newSourceBalance.toFixed(4)),
                    [`wallets_details.${sourceWalletIndex}.available_balance`]: mongoose.Types.Decimal128.fromString(newSourceAvailableBalance.toFixed(4)),
                    [`wallets_details.${sourceWalletIndex}.holding_amount`]: mongoose.Types.Decimal128.fromString(newSourceHoldingAmount.toFixed(4)),

                    // Transaction limit updates
                    ...sourceUpdateSet,
                },

                $inc: {
                    // Transaction limit increments
                    ...sourceUpdateInc,
                },
            },
            {
                session: mongoSession,
            }
        );
        if (sourceWalletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Source wallet balance changed before currency conversion");
        }

        // Destination wallet update
        const destinationWalletUpdateResult = await user_wallet_details.updateOne(
            {
                _id: walletDetails._id,

                wallets_details: {
                    $elemMatch: {
                        wallet_type: destinationWalletType,
                        wallet_currency: destinationCurrency,
                        wallet_status: "ACTIVE",
                        account_balance: latestDestinationWallet.account_balance,
                        available_balance: latestDestinationWallet.available_balance,
                    },
                },
            },
            {
                $set: {
                    [`wallets_details.${destinationWalletIndex}.account_balance`]: mongoose.Types.Decimal128.fromString(newDestinationBalance.toFixed(4)),
                    [`wallets_details.${destinationWalletIndex}.available_balance`]: mongoose.Types.Decimal128.fromString(
                        newDestinationAvailableBalance.toFixed(4)),

                    // Transaction limit updates
                    ...destinationUpdateSet,
                },

                $inc: {
                    // Transaction limit increments
                    ...destinationUpdateInc,
                },
            },
            {
                session: mongoSession,
            }
        );
        if (destinationWalletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Destination wallet balance changed before currency conversion");
        }

        // --------------------------------------------------
        // SOURCE TRANSACTION UPDATE
        //
        // Conversion out of source wallet
        // --------------------------------------------------
        const sourceHoldTransaction = await user_wallet_transactions.findOneAndUpdate(
            {
                cardholder_id: cardholderId,
                wallet_id: walletDetails._id,
                transaction_type: "HOLD",
                transaction_status: "PENDING",
                reference_id: conversionReferenceId as string,
            },
            {
                $set: {
                    transaction_type: "WITHDRAW",
                    transaction_status: "SUCCESS",

                    fee: mongoose.Types.Decimal128.fromString("0"),

                    balance_after: mongoose.Types.Decimal128.fromString(
                        newSourceBalance.toFixed(4)
                    ),

                    remarks:
                        `Currency conversion from ${sourceCurrency} to ${destinationCurrency}`,
                },
            },
            {
                session: mongoSession,
                new: true,
            }
        );
        if (!sourceHoldTransaction) {
            throw new ServiceError("Source wallet HOLD transaction could not be updated");
        }


        // --------------------------------------------------
        // DESTINATION TRANSACTION
        //
        // Conversion into destination wallet
        // --------------------------------------------------
        const destinationTransactionId = new Types.ObjectId();

        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderId,
                    wallet_id: walletDetails._id,
                    transaction_id: destinationTransactionId,
                    transaction_type: "LOAD",
                    transaction_status: "SUCCESS",
                    wallet_details: {
                        wallet_type: destinationWalletType,
                        wallet_currency: destinationCurrency,
                    },
                    amount: mongoose.Types.Decimal128.fromString(destinationAmount.toFixed(4)),
                    fee: mongoose.Types.Decimal128.fromString(feeAmount.toFixed(4)),
                    balance_before: mongoose.Types.Decimal128.fromString(destinationBalance.toFixed(4)),
                    balance_after: mongoose.Types.Decimal128.fromString(newDestinationBalance.toFixed(4)),
                    reference_id: conversionReferenceId as string,
                    remarks: `Currency conversion from ${sourceCurrency} to ${destinationCurrency}. FX rate: ${exchangeRate.toFixed(8)} `,
                },
            ],
            {
                session: mongoSession,
            }
        );


        // --------------------------------------------------
        // Update conversion quote
        //
        // IMPORTANT:
        // Only do this if your quote schema contains
        // quote_status: "EXECUTED".
        // --------------------------------------------------
        const quoteUpdateResult = await wallet_currency_conversion_quotes.updateOne(
            {
                _id: conversionQuote._id,
                quote_status: "ACTIVE",
            },
            {
                $set: {
                    quote_status: "EXECUTED",
                    executed_at: new Date(),
                    conversion_reference_id: conversionReferenceId,
                },
            },
            {
                session: mongoSession,
            }
        );


        if (quoteUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Currency conversion quote could not be marked as executed");
        }

        // Commit transaction
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message: "Currency conversion completed successfully",
            data: {
                conversion_reference_id: conversionReferenceId,
                source_currency: sourceCurrency,
                destination_currency: destinationCurrency,
                source_amount: sourceAmount.toFixed(4),
                conversion_fee: feeAmount.toFixed(4),
                amount_after_fee: sourceAmount.minus(feeAmount).toDecimalPlaces(4).toFixed(4),
                exchange_rate: exchangeRate.toFixed(8),
                destination_amount: destinationAmount.toFixed(4),
                source_balance_before: sourceBalance.toFixed(4),
                source_balance_after: newSourceBalance.toFixed(4),
                destination_balance_before: destinationBalance.toFixed(4),
                destination_balance_after: newDestinationBalance.toFixed(4),
                source_transaction_id: sourceHoldTransaction.transaction_id,
                destination_transaction_id: destinationTransactionId,
                quote_id: conversionQuote._id.toString(),
                quote_status: "EXECUTED",
            },
        };

    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ExecuteWalletCurrencyConversionTransaction",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `ExecuteWalletCurrencyConversionTransaction facing issue`, sanitizedError);
    }
    finally {

        await mongoSession.endSession();

    }
};


export default executeWalletCurrencyConversionTransaction;