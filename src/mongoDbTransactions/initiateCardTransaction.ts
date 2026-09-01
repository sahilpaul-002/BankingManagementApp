import mongoose, { Types } from "mongoose";
import crypto from "crypto";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, InvalidRequestBodyError, NotFoundError, ServiceError, } from "../utils/AppErrorClass.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import userCardTransactionValidationSchema from "../validations/userCardTransactionValidation.js";
import z from "zod";
import type { walletDetailsType, userCardDetailsSchemaTypes, } from "../types/schemaTypes.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import { Decimal } from "decimal.js";
import { calculateFeeAddedAmountService } from "../services/calculateFeeAddedAmountService.js";

const initiateCardTransaction = async (
    cardholderObjectId: Types.ObjectId,
    cardDetails: userCardDetailsSchemaTypes,
    transactionData: {
        transaction_type: "PURCHASE" | "REFUND" | "WITHDRAWAL" | "REVERSAL" | "FEE";
        authorization_type: "HOLD" | "IMMEDIATE",
        amount: string;
        merchant_name: string;
        merchant_category: string;
        merchant_country: string;
        remarks?: string | null;
        transaction_id?: string;
        reference_id?: string;
    }) => {
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Validate USD Wallet Balance
        const wallet = await user_wallet_details.findOne(
            {
                cardholder_id: cardholderObjectId,
            },
            {
                _id: 1,
                cardholder_id: 1,
                wallets_details: {
                    $elemMatch: {
                        wallet_currency: "USD",
                    },
                },
            }
        ).session(mongoSession).lean();
        if (!wallet || wallet.wallets_details.length === 0) {
            throw new BadRequestError("USD wallet not found");
        }
        const walletObjectId = wallet?._id

        const selectedWallet = wallet.wallets_details[0];
        if (selectedWallet?.wallet_status !== "ACTIVE") {
            throw new BadRequestError("USD wallet is inactive");
        }
        // xxxxxxxxxxxxxxxxxxxxxxxxxx \\

        const referenceId = crypto.randomUUID();

        // Validate wallet balance
        const currentBalance = new Decimal(selectedWallet.account_balance?.toString() ?? "0");
        const currentAvailableBalance = new Decimal(selectedWallet.available_balance?.toString() ?? "0");
        const currentHolding = new Decimal(selectedWallet.holding_amount?.toString() ?? "0");
        let transactionAmount = new Decimal(transactionData.amount);
        const transactionAmountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.toDecimalPlaces(4).toString());
        const negativeTransactionAmountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.negated().toDecimalPlaces(4).toString());

        // Calculate Fees
        let feeAmount = new Decimal(0);
        let originalTransaction = null;
        if (transactionData.transaction_type === "REFUND") {
            if (!transactionData.transaction_id) {
                throw new InvalidRequestBodyError("Original transaction ID is required for refund");
            }

            if (!transactionData.reference_id) {
                throw new InvalidRequestBodyError("Original reference ID is required for refund");
            }

            if (!Types.ObjectId.isValid(transactionData.transaction_id)) {
                throw new InvalidRequestBodyError("Invalid original transaction ID");
            }

            originalTransaction = await user_card_transactions.findOne(
                {
                    transaction_id: new Types.ObjectId(transactionData.transaction_id),
                    cardholder_id: cardholderObjectId,
                    reference_id: transactionData.reference_id,
                }
            ).session(mongoSession).lean();

            if (!originalTransaction) {
                throw new NotFoundError("Original card transaction not found");
            }

            if (originalTransaction.transaction_type !== "PURCHASE") {
                throw new BadRequestError("Only purchase transactions can be refunded");
            }

            if (originalTransaction.transaction_status !== "SUCCESS") {
                throw new BadRequestError("Only successful transactions can be refunded");
            }

            transactionAmount = new Decimal(originalTransaction.amount.toString());

            feeAmount = new Decimal(originalTransaction.fee.toString());
        }
        else {
            feeAmount = calculateFeeAddedAmountService(transactionAmount, "card_transaction_percent");
        }
        const totalTransactionAmount = transactionAmount.plus(feeAmount);
        const feeAmountDecimal128 = mongoose.Types.Decimal128.fromString(feeAmount.toDecimalPlaces(4).toString());
        const totalTransactionAmountDecimal128 = mongoose.Types.Decimal128.fromString(totalTransactionAmount.toDecimalPlaces(4).toString());
        const negativeTotalTransactionAmountDecimal128 = mongoose.Types.Decimal128.fromString(totalTransactionAmount.negated().toDecimalPlaces(4).toString());
        if (transactionData.transaction_type !== "REFUND" && totalTransactionAmount.greaterThan(currentAvailableBalance)) {
            throw new ServiceError("Insufficient available wallet balance");
        }

        const transactionId = new Types.ObjectId();

        const now = new Date();

        const updateInc: Record<string, mongoose.Types.Decimal128> = {};
        const updateSet: Record<string, any> = {};

        // ================== Check Authorization Type & Perform Action ================== \\ 
        if (transactionData.transaction_type === "REFUND" && transactionData.authorization_type !== "IMMEDIATE") {
            throw new BadRequestError("REFUND transactions must use IMMEDIATE authorization");
        }
        if (transactionData.authorization_type === "HOLD") {
            updateInc["wallets_details.$.holding_amount"] = totalTransactionAmountDecimal128;
            updateInc["wallets_details.$.available_balance"] = negativeTotalTransactionAmountDecimal128;
        }
        else {
            if (transactionData.transaction_type === "REFUND") {
                // Refund credits money back to the wallet.
                updateInc["wallets_details.$.account_balance"] = totalTransactionAmountDecimal128;
                updateInc["wallets_details.$.available_balance"] = totalTransactionAmountDecimal128;
            }
            else {
                // PURCHASE / WITHDRAWAL debit the wallet.
                updateInc["wallets_details.$.account_balance"] = negativeTotalTransactionAmountDecimal128;
                updateInc["wallets_details.$.available_balance"] = negativeTotalTransactionAmountDecimal128;

                // Update spending counters only for debit transactions.
                // Daily Limits Update
                const daily = selectedWallet.daily_transaction;
                if (!daily || daily.date.toDateString() !== now.toDateString()) {
                    updateSet["wallets_details.$.daily_transaction.debit"] = transactionAmountDecimal128;
                    updateSet["wallets_details.$.daily_transaction.date"] = now;
                }
                else {
                    updateInc["wallets_details.$.daily_transaction.debit"] = transactionAmountDecimal128;
                }

                // Monthly Limits Update
                const isSameMonth = selectedWallet?.monthly_transaction?.month === now.getMonth() + 1 && selectedWallet.monthly_transaction.year === now.getFullYear();

                if (isSameMonth) {
                    updateInc["wallets_details.$.monthly_transaction.debit"] = transactionAmountDecimal128;
                }
                else {
                    updateSet["wallets_details.$.monthly_transaction.debit"] = transactionAmountDecimal128;
                    updateSet["wallets_details.$.monthly_transaction.month"] = now.getMonth() + 1;
                    updateSet["wallets_details.$.monthly_transaction.year"] = now.getFullYear();
                }

                // Yearly Limits Update
                const isSameYear = selectedWallet?.yearly_transaction?.year === now.getFullYear();
                if (isSameYear) {
                    updateInc["wallets_details.$.yearly_transaction.debit"] = transactionAmountDecimal128;
                }
                else {
                    updateSet["wallets_details.$.yearly_transaction.debit"] = transactionAmountDecimal128;
                    updateSet["wallets_details.$.yearly_transaction.year"] = now.getFullYear();
                }
            }
        }
        //  ===================== xxxxxxxxxxxxxxxxxxxx ===================== \\ 

        // ==================== Update wallet (Move money to holding) ==================== \\
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                _id: walletObjectId,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: selectedWallet.wallet_type,
                        wallet_currency: selectedWallet.wallet_currency,
                    },
                },
            },

            {
                $inc: updateInc,
                $set: updateSet,
            },

            {
                new: true,
                session: mongoSession,
            }
        ).lean();

        if (!updatedWallet) {
            throw new ServiceError("Failed to update wallet");
        }

        // Generate wallet transaction payload
        const walletTransactionType = transactionData.authorization_type === "HOLD" ? "HOLD" : transactionData.transaction_type === "REFUND" ? "REFUND" : "WITHDRAW";
        const balanceAfter = (() => {
            if (transactionData.authorization_type === "HOLD") {
                return currentBalance;
            }

            if (transactionData.transaction_type === "REFUND") {
                return currentBalance.plus(totalTransactionAmount);
            }

            return currentBalance.minus(totalTransactionAmount);
        })();
        const balanceBeforeDecimal128 = mongoose.Types.Decimal128.fromString(currentBalance.toDecimalPlaces(4).toString());
        const balanceAfterDecimal128 = mongoose.Types.Decimal128.fromString(balanceAfter.toDecimalPlaces(4).toString());
        const walletTransactionPayload = {
            transaction_type: walletTransactionType,
            transaction_status: transactionData.authorization_type === "HOLD" ? "PENDING" : "SUCCESS",
            wallet_details: {
                wallet_type: selectedWallet.wallet_type,
                wallet_currency: selectedWallet.wallet_currency,
            },
            amount: totalTransactionAmountDecimal128,
            fee: feeAmountDecimal128,
            balance_before: balanceBeforeDecimal128,
            balance_after: balanceAfterDecimal128,
            reference_id: referenceId,
            remarks: transactionData.remarks ?? `Card ${transactionData.transaction_type} transaction`,
        };

        const walletValidation = userWalletTransactionsValidationSchema.safeParse(walletTransactionPayload);
        if (!walletValidation.success) {
            throw new ServiceError("Invalid wallet transaction", z.flattenError(walletValidation.error));
        }

        const walletTransaction = new user_wallet_transactions({
            cardholder_id: cardholderObjectId,
            wallet_id: walletObjectId,
            transaction_id: transactionId,
            transaction_type: walletValidation.data.transaction_type,
            transaction_status: walletValidation.data.transaction_status,
            wallet_details: walletValidation.data.wallet_details,
            amount: walletValidation.data.amount,
            fee: walletValidation.data.fee,
            balance_before: walletValidation.data.balance_before,
            balance_after: walletValidation.data.balance_after,
            reference_id: walletValidation.data.reference_id,
            remarks:
                walletValidation.data.remarks ??
                `Card ${transactionData.transaction_type} transaction`,
        });
        await walletTransaction.save({
            session: mongoSession,
        });

        const authorizationExpiresAt = new Date(
            Date.now() + 2 * 60 * 1000 // 2 minutes
        );

        const cardTransactionPayload = {
            cardholder_id: cardholderObjectId,
            card_id: cardDetails._id,
            transaction_id: transactionId,
            transaction_type: transactionData.transaction_type,
            transaction_status: transactionData.authorization_type === "HOLD" ? "PENDING" : "SUCCESS",
            authorization_type: transactionData.authorization_type,
            authorization_status: transactionData.authorization_type === "HOLD" ? "PENDING" : "AUTHORIZED",
            authorization_expires_at: transactionData.authorization_type === "HOLD" ? authorizationExpiresAt : new Date(),
            authorized_at: transactionData.authorization_type === "HOLD" ? null : new Date(),
            authorized_by: transactionData.authorization_type === "HOLD" ? null : cardholderObjectId?.toString(),
            card_number: cardDetails.card_number,
            currency: cardDetails.card_currency,
            name_on_card: cardDetails.name_on_card,
            amount: transactionAmountDecimal128,
            fee: feeAmountDecimal128,
            card_type: cardDetails.card_type,
            merchant_name: transactionData.merchant_name,
            merchant_category: transactionData.merchant_category,
            merchant_country: transactionData.merchant_country,
            reference_id: referenceId,
            remarks: transactionData.remarks ?? `Card ${transactionData.transaction_type} transaction`,
        };

        const cardValidation = userCardTransactionValidationSchema.safeParse(cardTransactionPayload);

        if (!cardValidation.success) {
            throw new ServiceError("Invalid card transaction", z.flattenError(cardValidation.error));
        }

        await user_card_transactions.create(
            [
                cardValidation.data
            ],
            {
                session: mongoSession,
            }
        );
        // xxxxxxxxxxxxxxxxxxxxxxxxxx \\

        // Commit MongoDB transaction
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message: "Card transaction created successfully",
            data: {
                walletId: walletObjectId?.toString(),
                cardId: cardDetails._id?.toString(),
                cardNumber: cardDetails.card_number,
                transactionId: transactionId?.toString(),
                referenceId,
                merchantName: transactionData?.merchant_name,
                authorizationExpiresAt
            },
        };
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, {
            serviceName: "UserHoldWalletTransactionService",
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UserHoldWalletTransactionService facing issue`, sanitizedError);
    }
    finally {
        await mongoSession.endSession();
    }
};

export default initiateCardTransaction