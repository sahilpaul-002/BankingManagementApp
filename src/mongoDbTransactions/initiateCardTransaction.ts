import mongoose from "mongoose";
import crypto from "crypto";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, ServiceError, } from "../utils/AppErrorClass.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import userCardTransactionValidationSchema from "../validations/userCardTransactionValidation.js";
import z from "zod";
import type { walletDetailsType, userCardDetailsSchemaTypes, } from "../types/schemaTypes.js";

const initiateCardTransaction = async (
    walletId: string,
    selectedWallet: walletDetailsType,
    cardDetails: userCardDetailsSchemaTypes,
    transactionData: {
        transaction_type: "PURCHASE" | "REFUND" | "WITHDRAWAL" | "REVERSAL" | "FEE";
        authorization_type: "HOLD" | "IMMEDIATE",
        amount: number;
        merchant_name: string;
        merchant_category: string;
        merchant_country: string;
        remarks?: string | null;
    }) => {
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        const referenceId = crypto.randomUUID();

        // Validate wallet balance
        const currentBalance = Number(selectedWallet.account_balance.toString());
        const currentHolding = Number(selectedWallet.holding_amount.toString());
        const holdAmount = transactionData.amount;
        const availableBalance = currentBalance - currentHolding;
        if (holdAmount > availableBalance) {
            throw new BadRequestError(
                "Insufficient available wallet balance"
            );
        }

        const transactionId = crypto.randomUUID();

        const now = new Date();

        const updateInc: Record<string, number> = {};
        const updateSet: Record<string, any> = {};

        // ================== Check Authorization Type & Perform Action ================== \\ 
        if (transactionData.authorization_type === "HOLD") {
            // Reserve money only
            updateInc["wallets_details.$.holding_amount"] = holdAmount;
        }
        else {
            // Immediate settlement
            updateInc["wallets_details.$.account_balance"] = -holdAmount;

            // Daily Limits Update
            const daily = selectedWallet.daily_transaction;
            if (!daily || daily.date.toDateString() !== now.toDateString()) {
                updateSet["wallets_details.$.daily_transaction.debit"] = holdAmount;
                updateSet["wallets_details.$.daily_transaction.date"] = now;
            }
            else {
                updateInc["wallets_details.$.daily_transaction.debit"] = holdAmount;
            }

            // Monthly Limits Update
            const isSameMonth = selectedWallet.monthly_transaction.month === now.getMonth() + 1 && selectedWallet.monthly_transaction.year === now.getFullYear();

            if (isSameMonth) {
                updateInc["wallets_details.$.monthly_transaction.debit"] = holdAmount;
            }
            else {
                updateSet["wallets_details.$.monthly_transaction.debit"] = holdAmount;
                updateSet["wallets_details.$.monthly_transaction.month"] = now.getMonth() + 1;
                updateSet["wallets_details.$.monthly_transaction.year"] = now.getFullYear();
            }

            // Yearly Limits Update
            const isSameYear = selectedWallet.yearly_transaction.year === now.getFullYear();
            if (isSameYear) {
                updateInc["wallets_details.$.yearly_transaction.debit"] = holdAmount;
            }
            else {
                updateSet["wallets_details.$.yearly_transaction.debit"] = holdAmount;
                updateSet["wallets_details.$.yearly_transaction.year"] = now.getFullYear();
            }
        }
        //  ===================== xxxxxxxxxxxxxxxxxxxx ===================== \\ 

        // ==================== Update wallet (Move money to holding) ==================== \\
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                wallet_id: walletId,
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

        const walletTransactionPayload = {
            transaction_type: transactionData.authorization_type === "HOLD" ? "HOLD" : "WITHDRAW",
            transaction_status: transactionData.authorization_type === "HOLD" ? "PENDING" : "SUCCESS",
            wallet_details: {
                wallet_type: selectedWallet.wallet_type,
                wallet_currency: selectedWallet.wallet_currency,
            },
            amount: holdAmount,
            balance_before: currentBalance,
            balance_after: transactionData.authorization_type === "HOLD" ? currentBalance : currentBalance - holdAmount,
            reference_id: referenceId,
            remarks: transactionData.remarks ?? `Card ${transactionData.transaction_type} transaction`,
        };

        const walletValidation = userWalletTransactionsValidationSchema.safeParse(walletTransactionPayload);
        if (!walletValidation.success) {
            throw new ServiceError("Invalid wallet transaction", z.flattenError(walletValidation.error));
        }

        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardDetails.cardholder_id,
                    wallet_id: walletId,
                    transaction_id: transactionId,
                    transaction_type: walletValidation.data.transaction_type,
                    transaction_status: walletValidation.data.transaction_status,
                    wallet_details: walletValidation.data.wallet_details,
                    amount: walletValidation.data.amount,
                    balance_before: walletValidation.data.balance_before,
                    balance_after: walletValidation.data.balance_after,
                    reference_id: walletValidation.data.reference_id,
                    remarks: walletValidation.data.remarks ?? `Card ${transactionData.transaction_type} transaction`,
                },
            ],
            {
                session: mongoSession,
            }
        );

        const cardTransactionPayload = {
            cardholder_id: cardDetails.cardholder_id,
            card_id: cardDetails.card_id,
            transaction_id: transactionId,
            transaction_type: transactionData.transaction_type,
            transaction_status: transactionData.authorization_type === "HOLD" ? "PENDING" : "SUCCESS",
            card_number: cardDetails.card_number,
            currency: cardDetails.card_currency,
            name_on_card: cardDetails.name_on_card,
            amount: holdAmount,
            card_type: cardDetails.card_type,
            merchant_name: transactionData.merchant_name,
            merchant_category: transactionData.merchant_category,
            merchant_country: transactionData.merchant_country,
            reference_id: referenceId,
            remarks: transactionData.remarks ?? `Card ${transactionData.transaction_type} transaction`,
        };

        const cardValidation = userCardTransactionValidationSchema.safeParse(cardTransactionPayload);

        if (!cardValidation.success) {
            throw new ServiceError("Invalid card transaction",z.flattenError(cardValidation.error));}

        await user_card_transactions.create(
            [
                {
                    ...cardValidation.data,
                    amount: mongoose.Types.Decimal128.fromString(
                        holdAmount.toString()
                    ),
                },
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
                walletId: updatedWallet.wallet_id,
                cardId: cardDetails.card_id,
                transactionId: transactionId,
                referenceId,
            },
        };
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, {
            serviceName: "UserHoldWalletTransactionService",
        });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `UserHoldWalletTransactionService facing issue: ${error.message}`
        );
    }
    finally {
        await mongoSession.endSession();
    }
};

export default initiateCardTransaction