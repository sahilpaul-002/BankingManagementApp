import mongoose, { Types } from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import {
    AppErrorClass,
    NotFoundError,
    ServiceError,
} from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import crypto from "crypto";
import { Decimal } from "decimal.js";
import { FEE_DETAILS } from "../configs/configConstants.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import z from "zod";
import type { SafeParseResult } from "../types/zodTypes.js";


type WalletToWalletLoadTransactionDataType = {
    sourceUserId: Types.ObjectId;
    sourceWalletId: Types.ObjectId;
    destinationWalletId: Types.ObjectId;
    amount: Decimal;
};


const walletToWalletLoadTransaction = async (
    transactionData: WalletToWalletLoadTransactionDataType
) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        const {
            sourceUserId,
            sourceWalletId,
            destinationWalletId,
            amount,
        } = transactionData;

        const now = new Date();

        // ============================================================
        // BASIC AMOUNT VALIDATION
        // ============================================================

        const transferAmount = new Decimal(amount.toString());

        if (!transferAmount.isFinite() || transferAmount.lte(0)) {
            throw new ServiceError(
                "Wallet-to-wallet transfer amount must be greater than zero"
            );
        }

        // ============================================================
        // SOURCE WALLET DETAILS
        // ============================================================

        const sourceWalletDetails =
            await user_wallet_details
                .findOne({
                    _id: sourceWalletId,
                    user_id: sourceUserId,
                })
                .session(mongoSession)
                .lean();

        if (!sourceWalletDetails) {
            throw new NotFoundError(
                "Source wallet details not found"
            );
        }

        if (
            !sourceWalletDetails.wallets_details ||
            sourceWalletDetails.wallets_details.length === 0
        ) {
            throw new NotFoundError(
                "Source user wallets not found"
            );
        }

        // ============================================================
        // SOURCE USD WALLET
        // ============================================================

        const sourceWalletIndex =
            sourceWalletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency === "USD" &&
                    wallet.wallet_status === "ACTIVE"
            );

        if (sourceWalletIndex === -1) {
            throw new NotFoundError(
                "Active USD source wallet not found"
            );
        }

        const sourceWallet =
            sourceWalletDetails.wallets_details[sourceWalletIndex];

        if (!sourceWallet) {
            throw new ServiceError(
                "Source USD wallet details not found"
            );
        }

        // ============================================================
        // SOURCE WALLET ACCOUNTING VALIDATION
        // ============================================================

        const sourceAccountBalance = new Decimal(
            sourceWallet.account_balance?.toString() ?? "0"
        );

        const sourceAvailableBalance = new Decimal(
            sourceWallet.available_balance?.toString() ?? "0"
        );

        const sourceHoldingAmount = new Decimal(
            sourceWallet.holding_amount?.toString() ?? "0"
        );

        if (
            !sourceAccountBalance.isFinite() ||
            sourceAccountBalance.lt(0)
        ) {
            throw new ServiceError(
                "Invalid source wallet account balance"
            );
        }

        if (
            !sourceAvailableBalance.isFinite() ||
            sourceAvailableBalance.lt(0)
        ) {
            throw new ServiceError(
                "Invalid source wallet available balance"
            );
        }

        if (
            !sourceHoldingAmount.isFinite() ||
            sourceHoldingAmount.lt(0)
        ) {
            throw new ServiceError(
                "Invalid source wallet holding amount"
            );
        }

        if (
            !sourceAvailableBalance
                .plus(sourceHoldingAmount)
                .toDecimalPlaces(4)
                .equals(sourceAccountBalance.toDecimalPlaces(4))
        ) {
            throw new ServiceError(
                "Invalid source USD wallet balance"
            );
        }

        // ============================================================
        // DESTINATION WALLET DETAILS
        // ============================================================

        const destinationWalletDetails =
            await user_wallet_details
                .findOne({
                    _id: destinationWalletId,
                })
                .session(mongoSession)
                .lean();

        if (!destinationWalletDetails) {
            throw new NotFoundError(
                "Destination wallet details not found"
            );
        }

        if (
            !destinationWalletDetails.wallets_details ||
            destinationWalletDetails.wallets_details.length === 0
        ) {
            throw new NotFoundError(
                "Destination user wallets not found"
            );
        }

        // ============================================================
        // PREVENT SAME WALLET TRANSFER
        // ============================================================

        if (
            sourceWalletDetails._id.toString() ===
            destinationWalletDetails._id.toString()
        ) {
            throw new ServiceError(
                "Source and destination wallet cannot be the same"
            );
        }

        // ============================================================
        // DESTINATION USD WALLET
        // ============================================================

        const destinationWalletIndex =
            destinationWalletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency === "USD" &&
                    wallet.wallet_status === "ACTIVE"
            );

        if (destinationWalletIndex === -1) {
            throw new NotFoundError(
                "Active USD destination wallet not found"
            );
        }

        const destinationWallet =
            destinationWalletDetails.wallets_details[
            destinationWalletIndex
            ];

        if (!destinationWallet) {
            throw new ServiceError(
                "Destination USD wallet details not found"
            );
        }

        // ============================================================
        // DESTINATION WALLET ACCOUNTING VALIDATION
        // ============================================================

        const destinationAccountBalance = new Decimal(
            destinationWallet.account_balance?.toString() ?? "0"
        );

        const destinationAvailableBalance = new Decimal(
            destinationWallet.available_balance?.toString() ?? "0"
        );

        const destinationHoldingAmount = new Decimal(
            destinationWallet.holding_amount?.toString() ?? "0"
        );

        if (
            !destinationAccountBalance.isFinite() ||
            destinationAccountBalance.lt(0)
        ) {
            throw new ServiceError(
                "Invalid destination wallet account balance"
            );
        }

        if (
            !destinationAvailableBalance.isFinite() ||
            destinationAvailableBalance.lt(0)
        ) {
            throw new ServiceError(
                "Invalid destination wallet available balance"
            );
        }

        if (
            !destinationHoldingAmount.isFinite() ||
            destinationHoldingAmount.lt(0)
        ) {
            throw new ServiceError(
                "Invalid destination wallet holding amount"
            );
        }

        if (
            destinationAvailableBalance
                .plus(destinationHoldingAmount)
                .toDecimalPlaces(4)
                .equals(destinationAccountBalance.toDecimalPlaces(4)) === false
        ) {
            throw new ServiceError(
                "Invalid destination USD wallet balance"
            );
        }

        // ============================================================
        // M2P FEE CALCULATION
        // ============================================================

        const feePercentage = new Decimal(
            FEE_DETAILS.m2p_percent.toString()
        );

        if (
            !feePercentage.isFinite() ||
            feePercentage.lt(0)
        ) {
            throw new ServiceError(
                "Invalid M2P fee configuration"
            );
        }

        const feeAmount = transferAmount
            .mul(feePercentage)
            .div(100)
            .toDecimalPlaces(4);

        if (
            !feeAmount.isFinite() ||
            feeAmount.lt(0)
        ) {
            throw new ServiceError(
                "Invalid M2P fee calculated"
            );
        }

        // ============================================================
        // DESTINATION AMOUNT
        //
        // Source sends gross amount.
        // M2P fee is deducted from the transfer amount.
        //
        // Example:
        // 100 USD
        // Fee = 6 USD
        // Destination = 94 USD
        // ============================================================

        const destinationAmount = transferAmount
            .minus(feeAmount)
            .toDecimalPlaces(4);

        if (
            !destinationAmount.isFinite() ||
            destinationAmount.lte(0)
        ) {
            throw new ServiceError(
                "Invalid destination amount calculated"
            );
        }

        // ============================================================
        // SOURCE SUFFICIENT BALANCE CHECK
        // ============================================================

        if (sourceAvailableBalance.lt(transferAmount)) {
            throw new ServiceError(
                "Insufficient source USD wallet balance"
            );
        }

        // ============================================================
        // CALCULATE SOURCE BALANCE AFTER
        // ============================================================

        const sourceAccountBalanceAfter =
            sourceAccountBalance
                .minus(transferAmount)
                .toDecimalPlaces(4);

        const sourceAvailableBalanceAfter =
            sourceAvailableBalance
                .minus(transferAmount)
                .toDecimalPlaces(4);

        const sourceHoldingAmountAfter =
            sourceHoldingAmount.toDecimalPlaces(4);

        if (
            sourceAccountBalanceAfter.lt(0) ||
            sourceAvailableBalanceAfter.lt(0)
        ) {
            throw new ServiceError(
                "Invalid source wallet balance after transfer"
            );
        }

        if (
            sourceAvailableBalanceAfter
                .plus(sourceHoldingAmountAfter)
                .toDecimalPlaces(4)
                .equals(sourceAccountBalanceAfter) === false
        ) {
            throw new ServiceError(
                "Invalid source USD wallet balance after transfer"
            );
        }

        // ============================================================
        // CALCULATE DESTINATION BALANCE AFTER
        // ============================================================

        const destinationAccountBalanceAfter =
            destinationAccountBalance
                .plus(destinationAmount)
                .toDecimalPlaces(4);

        const destinationAvailableBalanceAfter =
            destinationAvailableBalance
                .plus(destinationAmount)
                .toDecimalPlaces(4);

        const destinationHoldingAmountAfter =
            destinationHoldingAmount.toDecimalPlaces(4);

        if (
            !destinationAccountBalanceAfter.isFinite() ||
            !destinationAvailableBalanceAfter.isFinite()
        ) {
            throw new ServiceError(
                "Invalid destination wallet balance after transfer"
            );
        }

        if (
            destinationAvailableBalanceAfter
                .plus(destinationHoldingAmountAfter)
                .toDecimalPlaces(4)
                .equals(destinationAccountBalanceAfter) === false
        ) {
            throw new ServiceError(
                "Invalid destination USD wallet balance after transfer"
            );
        }

        // ============================================================
        // MONGO DECIMAL VALUES
        // ============================================================

        const transferAmountDecimal128 =
            mongoose.Types.Decimal128.fromString(
                transferAmount.toDecimalPlaces(4).toString()
            );

        const destinationAmountDecimal128 =
            mongoose.Types.Decimal128.fromString(
                destinationAmount.toDecimalPlaces(4).toString()
            );

        const feeAmountDecimal128 =
            mongoose.Types.Decimal128.fromString(
                feeAmount.toDecimalPlaces(4).toString()
            );

        // ============================================================
        // SOURCE DAILY / MONTHLY / YEARLY TRANSACTIONS
        // ============================================================

        const sourceUpdateInc: Record<
            string,
            mongoose.Types.Decimal128
        > = {};

        const sourceUpdateSet: Record<string, any> = {};

        const sourceDaily = sourceWallet.daily_transaction;

        if (
            !sourceDaily?.date ||
            sourceDaily.date.toDateString() !== now.toDateString()
        ) {
            sourceUpdateSet[
                "wallets_details.$.daily_transaction.debit"
            ] = transferAmountDecimal128;

            sourceUpdateSet[
                "wallets_details.$.daily_transaction.date"
            ] = now;
        } else {
            sourceUpdateInc[
                "wallets_details.$.daily_transaction.debit"
            ] = transferAmountDecimal128;
        }

        const sourceSameMonth =
            sourceWallet.monthly_transaction?.month ===
            now.getMonth() + 1 &&
            sourceWallet.monthly_transaction?.year ===
            now.getFullYear();

        if (sourceSameMonth) {
            sourceUpdateInc[
                "wallets_details.$.monthly_transaction.debit"
            ] = transferAmountDecimal128;
        } else {
            sourceUpdateSet[
                "wallets_details.$.monthly_transaction.debit"
            ] = transferAmountDecimal128;

            sourceUpdateSet[
                "wallets_details.$.monthly_transaction.month"
            ] = now.getMonth() + 1;

            sourceUpdateSet[
                "wallets_details.$.monthly_transaction.year"
            ] = now.getFullYear();
        }

        const sourceSameYear =
            sourceWallet.yearly_transaction?.year ===
            now.getFullYear();

        if (sourceSameYear) {
            sourceUpdateInc[
                "wallets_details.$.yearly_transaction.debit"
            ] = transferAmountDecimal128;
        } else {
            sourceUpdateSet[
                "wallets_details.$.yearly_transaction.debit"
            ] = transferAmountDecimal128;

            sourceUpdateSet[
                "wallets_details.$.yearly_transaction.year"
            ] = now.getFullYear();
        }

        // ============================================================
        // DESTINATION DAILY / MONTHLY / YEARLY TRANSACTIONS
        // ============================================================

        const destinationUpdateInc: Record<
            string,
            mongoose.Types.Decimal128
        > = {};

        const destinationUpdateSet: Record<string, any> = {};

        const destinationDaily =
            destinationWallet.daily_transaction;

        if (
            !destinationDaily?.date ||
            destinationDaily.date.toDateString() !== now.toDateString()
        ) {
            destinationUpdateSet[
                "wallets_details.$.daily_transaction.credit"
            ] = destinationAmountDecimal128;

            destinationUpdateSet[
                "wallets_details.$.daily_transaction.date"
            ] = now;
        } else {
            destinationUpdateInc[
                "wallets_details.$.daily_transaction.credit"
            ] = destinationAmountDecimal128;
        }

        const destinationSameMonth =
            destinationWallet.monthly_transaction?.month ===
            now.getMonth() + 1 &&
            destinationWallet.monthly_transaction?.year ===
            now.getFullYear();

        if (destinationSameMonth) {
            destinationUpdateInc[
                "wallets_details.$.monthly_transaction.credit"
            ] = destinationAmountDecimal128;
        } else {
            destinationUpdateSet[
                "wallets_details.$.monthly_transaction.credit"
            ] = destinationAmountDecimal128;

            destinationUpdateSet[
                "wallets_details.$.monthly_transaction.month"
            ] = now.getMonth() + 1;

            destinationUpdateSet[
                "wallets_details.$.monthly_transaction.year"
            ] = now.getFullYear();
        }

        const destinationSameYear =
            destinationWallet.yearly_transaction?.year ===
            now.getFullYear();

        if (destinationSameYear) {
            destinationUpdateInc[
                "wallets_details.$.yearly_transaction.credit"
            ] = destinationAmountDecimal128;
        } else {
            destinationUpdateSet[
                "wallets_details.$.yearly_transaction.credit"
            ] = destinationAmountDecimal128;

            destinationUpdateSet[
                "wallets_details.$.yearly_transaction.year"
            ] = now.getFullYear();
        }

        // ============================================================
        // UPDATE SOURCE WALLET
        // ============================================================

        const sourceUpdate: Record<string, any> = {
            $inc: {
                ...sourceUpdateInc,
                "wallets_details.$.account_balance":
                    mongoose.Types.Decimal128.fromString(
                        transferAmount
                            .negated()
                            .toDecimalPlaces(4)
                            .toString()
                    ),
                "wallets_details.$.available_balance":
                    mongoose.Types.Decimal128.fromString(
                        transferAmount
                            .negated()
                            .toDecimalPlaces(4)
                            .toString()
                    ),
            },
        };

        if (Object.keys(sourceUpdateSet).length > 0) {
            sourceUpdate.$set = sourceUpdateSet;
        }

        const updatedSourceWallet =
            await user_wallet_details.findOneAndUpdate(
                {
                    _id: sourceWalletId,
                    user_id: sourceUserId,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type: "FIAT",
                            wallet_currency: "USD",
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
                sourceUpdate,
                {
                    new: true,
                    session: mongoSession,
                }
            ).lean();

        if (!updatedSourceWallet) {
            throw new ServiceError(
                "Source wallet update failed"
            );
        }

        // ============================================================
        // UPDATE DESTINATION WALLET
        // ============================================================

        const destinationUpdate: Record<string, any> = {
            $inc: {
                ...destinationUpdateInc,
                "wallets_details.$.account_balance":
                    destinationAmountDecimal128,

                "wallets_details.$.available_balance":
                    destinationAmountDecimal128,
            },
        };

        if (Object.keys(destinationUpdateSet).length > 0) {
            destinationUpdate.$set = destinationUpdateSet;
        }

        const updatedDestinationWallet =
            await user_wallet_details.findOneAndUpdate(
                {
                    _id: destinationWalletId,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type: "FIAT",
                            wallet_currency: "USD",
                            wallet_status: "ACTIVE",

                            account_balance:
                                destinationWallet.account_balance,

                            available_balance:
                                destinationWallet.available_balance,

                            holding_amount:
                                destinationWallet.holding_amount,
                        },
                    },
                },
                destinationUpdate,
                {
                    new: true,
                    session: mongoSession,
                }
            ).lean();

        if (!updatedDestinationWallet) {
            throw new ServiceError(
                "Destination wallet update failed"
            );
        }

        // ============================================================
        // TRANSACTION REFERENCES
        // ============================================================

        const transferReferenceId = crypto.randomUUID();

        // ============================================================
        // SOURCE TRANSACTION
        // ============================================================

        const sourceTransactionPayload = {
            transaction_type: "TRANSFER",
            transaction_status: "SUCCESS",

            wallet_details: {
                wallet_type: "FIAT",
                wallet_currency: "USD",
            },

            amount: transferAmount.toDecimalPlaces(4),

            fee: feeAmount.toDecimalPlaces(4),

            balance_before:
                sourceAccountBalance.toDecimalPlaces(4),

            balance_after:
                sourceAccountBalanceAfter.toDecimalPlaces(4),

            reference_id: transferReferenceId,

            remarks:
                `Wallet-to-wallet transfer to wallet ${destinationWalletId.toString()}. ` +
                `Transfer amount: ${transferAmount.toDecimalPlaces(4)} USD. ` +
                `M2P fee: ${feeAmount.toDecimalPlaces(4)} USD. ` +
                `Destination amount: ${destinationAmount.toDecimalPlaces(4)} USD.`,
        };

        const sourceTransactionValidation:
            SafeParseResult<
                z.infer<typeof userWalletTransactionsValidationSchema>
            > =
            userWalletTransactionsValidationSchema.safeParse(
                sourceTransactionPayload
            );

        if (!sourceTransactionValidation.success) {
            throw new ServiceError(
                "Invalid source wallet transaction request",
                z.flattenError(
                    sourceTransactionValidation.error
                )
            );
        }

        // ============================================================
        // DESTINATION TRANSACTION
        // ============================================================

        const destinationTransactionPayload = {
            transaction_type: "LOAD",
            transaction_status: "SUCCESS",

            wallet_details: {
                wallet_type: "FIAT",
                wallet_currency: "USD",
            },

            amount: destinationAmount.toDecimalPlaces(4),

            fee: new Decimal(0),

            balance_before:
                destinationAccountBalance.toDecimalPlaces(4),

            balance_after:
                destinationAccountBalanceAfter.toDecimalPlaces(4),

            reference_id: transferReferenceId,

            remarks:
                `Wallet-to-wallet transfer received from wallet ${sourceWalletId.toString()}. ` +
                `Received amount: ${destinationAmount.toDecimalPlaces(4)} USD. ` +
                `M2P fee deducted: ${feeAmount.toDecimalPlaces(4)} USD.`,
        };

        const destinationTransactionValidation:
            SafeParseResult<
                z.infer<typeof userWalletTransactionsValidationSchema>
            > =
            userWalletTransactionsValidationSchema.safeParse(
                destinationTransactionPayload
            );

        if (!destinationTransactionValidation.success) {
            throw new ServiceError(
                "Invalid destination wallet transaction request",
                z.flattenError(
                    destinationTransactionValidation.error
                )
            );
        }

        // ============================================================
        // DECIMAL128 TRANSACTION VALUES
        // ============================================================

        const sourceAmountDecimal128 =
            mongoose.Types.Decimal128.fromString(
                sourceTransactionValidation.data.amount
                    .toDecimalPlaces(4)
                    .toString()
            );

        const sourceFeeDecimal128 =
            mongoose.Types.Decimal128.fromString(
                sourceTransactionValidation.data.fee
                    .toDecimalPlaces(4)
                    .toString()
            );

        const sourceBalanceBeforeDecimal128 =
            mongoose.Types.Decimal128.fromString(
                sourceTransactionValidation.data.balance_before
                    .toDecimalPlaces(4)
                    .toString()
            );

        const sourceBalanceAfterDecimal128 =
            mongoose.Types.Decimal128.fromString(
                sourceTransactionValidation.data.balance_after
                    .toDecimalPlaces(4)
                    .toString()
            );

        const destinationAmountTransactionDecimal128 =
            mongoose.Types.Decimal128.fromString(
                destinationTransactionValidation.data.amount
                    .toDecimalPlaces(4)
                    .toString()
            );

        const destinationFeeDecimal128 =
            mongoose.Types.Decimal128.fromString(
                destinationTransactionValidation.data.fee
                    .toDecimalPlaces(4)
                    .toString()
            );

        const destinationBalanceBeforeDecimal128 =
            mongoose.Types.Decimal128.fromString(
                destinationTransactionValidation.data.balance_before
                    .toDecimalPlaces(4)
                    .toString()
            );

        const destinationBalanceAfterDecimal128 =
            mongoose.Types.Decimal128.fromString(
                destinationTransactionValidation.data.balance_after
                    .toDecimalPlaces(4)
                    .toString()
            );

        // ============================================================
        // CREATE SOURCE TRANSACTION
        // ============================================================

        await user_wallet_transactions.create(
            [
                {
                    cardholder_id:
                        sourceWalletDetails.cardholder_id,

                    wallet_id:
                        sourceWalletDetails._id,

                    transaction_id:
                        new Types.ObjectId(),

                    transaction_type:
                        sourceTransactionValidation.data
                            .transaction_type,

                    transaction_status:
                        sourceTransactionValidation.data
                            .transaction_status,

                    wallet_details: {
                        wallet_type:
                            sourceTransactionValidation.data
                                .wallet_details.wallet_type,

                        wallet_currency:
                            sourceTransactionValidation.data
                                .wallet_details.wallet_currency,
                    },

                    amount:
                        sourceAmountDecimal128,

                    fee:
                        sourceFeeDecimal128,

                    balance_before:
                        sourceBalanceBeforeDecimal128,

                    balance_after:
                        sourceBalanceAfterDecimal128,

                    reference_id:
                        sourceTransactionValidation.data
                            .reference_id as string,

                    remarks:
                        sourceTransactionValidation.data
                            .remarks as string,
                },
            ],
            {
                session: mongoSession,
            }
        );

        // ============================================================
        // CREATE DESTINATION TRANSACTION
        // ============================================================

        await user_wallet_transactions.create(
            [
                {
                    cardholder_id:
                        destinationWalletDetails.cardholder_id,

                    wallet_id:
                        destinationWalletDetails._id,

                    transaction_id:
                        new Types.ObjectId(),

                    transaction_type:
                        destinationTransactionValidation.data
                            .transaction_type,

                    transaction_status:
                        destinationTransactionValidation.data
                            .transaction_status,

                    wallet_details: {
                        wallet_type:
                            destinationTransactionValidation.data
                                .wallet_details.wallet_type,

                        wallet_currency:
                            destinationTransactionValidation.data
                                .wallet_details.wallet_currency,
                    },

                    amount:
                        destinationAmountTransactionDecimal128,

                    fee:
                        destinationFeeDecimal128,

                    balance_before:
                        destinationBalanceBeforeDecimal128,

                    balance_after:
                        destinationBalanceAfterDecimal128,

                    reference_id:
                        destinationTransactionValidation.data
                            .reference_id as string,

                    remarks:
                        destinationTransactionValidation.data
                            .remarks as string,
                },
            ],
            {
                session: mongoSession,
            }
        );

        // ============================================================
        // COMMIT TRANSACTION
        // ============================================================

        await mongoSession.commitTransaction();

        // ============================================================
        // RESPONSE
        // ============================================================

        return {
            status: "SUCCESS",
            message: "Wallet-to-wallet transfer completed successfully",
            data: {
                source_wallet_id:
                    sourceWalletDetails._id.toString(),

                destination_wallet_id:
                    destinationWalletDetails._id.toString(),

                source_currency: "USD",

                transfer_amount:
                    transferAmount.toDecimalPlaces(4),

                fee_amount:
                    feeAmount.toDecimalPlaces(4),

                destination_amount:
                    destinationAmount.toDecimalPlaces(4),

                reference_id:
                    transferReferenceId,

                source_wallet_balance:
                    sourceAccountBalanceAfter.toDecimalPlaces(4),

                destination_wallet_balance:
                    destinationAccountBalanceAfter.toDecimalPlaces(4),
            },
        };

    } catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName:
                    "WalletToWalletLoadTransactionService",
            }
        );

        const sanitizedError =
            sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            "WalletToWalletLoadTransactionService facing issue",
            sanitizedError
        );

    } finally {

        await mongoSession.endSession();

    }
};


export default walletToWalletLoadTransaction;