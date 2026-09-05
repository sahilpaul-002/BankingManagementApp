import mongoose, { Types } from "mongoose";
import { Decimal } from "decimal.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes } from "../models/wallet_currency_conversion_quotes.js";
import { AppErrorClass, ServiceError, NotFoundError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import type { walletCurrencyType, walletDetailsType } from "../types/schemaTypes.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import crypto from "crypto"

interface CreateWalletCurrencyConversionTransactionType {
    userId: Types.ObjectId;
    cardholderId: Types.ObjectId;
    walletId: Types.ObjectId;
    sourceCurrency: walletCurrencyType;
    destinationCurrency: walletCurrencyType;
    sourceAmount: Decimal;
    destinationAmount: Decimal;
    exchangeRate: Decimal;
    feePercentage: Decimal;
    feeAmount: Decimal;
    expiresAt: Date;
}


const createWalletCurrencyConversionTransaction = async ({
    userId,
    cardholderId,
    walletId,
    sourceCurrency,
    destinationCurrency,
    sourceAmount,
    destinationAmount,
    exchangeRate,
    feePercentage,
    feeAmount,
    expiresAt,
}: CreateWalletCurrencyConversionTransactionType) => {

    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();


        // Validate quote amounts
        if (!sourceAmount.isFinite() || sourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid source amount");
        }
        if (!destinationAmount.isFinite() || destinationAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid destination amount");
        }
        if (!exchangeRate.isFinite() || exchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid conversion rate");
        }
        if (!feePercentage.isFinite() || feePercentage.isNegative()) {
            throw new ServiceError("Invalid conversion fee percentage");
        }
        if (!feeAmount.isFinite() || feeAmount.isNegative()) {
            throw new ServiceError("Invalid conversion fee amount");
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
            throw new NotFoundError(`Active ${sourceCurrency} source wallet not found`);
        }

        // Find latest destination wallet
        const destinationWalletIndex = walletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === destinationWalletType &&
                wallet.wallet_currency === destinationCurrency &&
                wallet.wallet_status === "ACTIVE"
        );
        if (destinationWalletIndex === -1) {
            throw new NotFoundError(`Active ${destinationCurrency} destination wallet not found`);
        }

        // Prevent same wallet conversion
        if (sourceWalletIndex === destinationWalletIndex) {
            throw new ServiceError("Source an wallets cannot be the same");
        }

        // Get latest source wallet
        const sourceWallet = walletDetails.wallets_details[
            sourceWalletIndex
        ];
        if (!sourceWallet) {
            throw new ServiceError("Source wallet not found");
        }

        // Get latest destination wallet
        const destinationWallet = walletDetails.wallets_details[
            destinationWalletIndex];
        if (!destinationWallet) {
            throw new ServiceError("Destination wallet not found");
        }

        // Get current source balance
        const sourceAccountBalance = new Decimal(sourceWallet.account_balance?.toString() ?? "0");
        const sourceAvailableBalance = new Decimal(sourceWallet.available_balance?.toString() ?? "0");
        const sourceHoldingAmount = new Decimal(sourceWallet.holding_amount?.toString() ?? "0");
        if (sourceAvailableBalance.lessThan(sourceAmount)) {
            throw new ServiceError(`Insufficient available ${sourceCurrency} wallet balance`);
        }
        if (!sourceAvailableBalance.plus(sourceHoldingAmount).toDecimalPlaces(4).equals(sourceAccountBalance.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${sourceCurrency} wallet balance`);
        }

        // Calculate new holding amount
        const newAvailableBalance = sourceAvailableBalance.minus(sourceAmount).toDecimalPlaces(4);
        const newHoldingAmount = sourceHoldingAmount.plus(sourceAmount).toDecimalPlaces(4);

        // Update source wallet holding balance
        const holdingUpdateResult = await user_wallet_details.updateOne(
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
        if (holdingUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Source wallet balance changed before currency conversion quote could be created");
        }

        const conversionReferenceId = crypto.randomUUID();
        const sourceTransactionId = new Types.ObjectId();

        // Create Souce Wallet Transaction
        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderId,
                    wallet_id: walletDetails._id,
                    transaction_id: sourceTransactionId,
                    transaction_type: "HOLD",
                    transaction_status: "PENDING",
                    wallet_details: {
                        wallet_type: sourceWalletType,
                        wallet_currency: sourceCurrency,
                    },
                    amount: mongoose.Types.Decimal128.fromString(sourceAmount.toFixed(4)),
                    // Source wallet has no fee deduction
                    fee: mongoose.Types.Decimal128.fromString("0"),
                    balance_before: mongoose.Types.Decimal128.fromString(sourceAccountBalance.toFixed(4)),
                    balance_after: mongoose.Types.Decimal128.fromString(sourceAccountBalance.toFixed(4)),
                    reference_id: conversionReferenceId,
                    remarks: `Currency conversion amount held from ${sourceCurrency} wallet for conversion to ${destinationCurrency}`,
                },
            ],
            {
                session: mongoSession,
            }
        );

        // Create currency conversion quote
        const conversionQuote = await wallet_currency_conversion_quotes.create(
            [
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    wallet_id: walletDetails._id,
                    source_currency: sourceCurrency,
                    source_amount: mongoose.Types.Decimal128.fromString(sourceAmount.toFixed(4)),
                    destination_currency: destinationCurrency,
                    destination_amount: mongoose.Types.Decimal128.fromString(destinationAmount.toFixed(4)),
                    exchange_rate: mongoose.Types.Decimal128.fromString(exchangeRate.toFixed(4)),
                    fee_percentage: mongoose.Types.Decimal128.fromString(feePercentage.toFixed(4)),
                    fee_amount: mongoose.Types.Decimal128.fromString(feeAmount.toFixed(4)),
                    quote_status: "ACTIVE",
                    conversion_reference_id: conversionReferenceId,
                    expires_at: expiresAt,
                },
            ],
            {
                session: mongoSession,
            }
        );
        const createdQuote = conversionQuote[0];
        if (!createdQuote) {
            throw new ServiceError("Currency conversion quote could not be created");
        }


        // Commit MongoDB transaction
        await mongoSession.commitTransaction();
        return {
            status: "SUCCESS",
            conversionQuote: createdQuote,
            sourceHoldingAmount: newHoldingAmount.toFixed(4),
        };
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "CreateWalletCurrencyConversionTransaction",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(`CreateWalletCurrencyConversionTransaction facing issue`, sanitizedError);
    }
    finally {

        await mongoSession.endSession();

    }
};


export default createWalletCurrencyConversionTransaction;