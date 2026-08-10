import mongoose from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError } from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";
import z from "zod";
import type { SafeParseSuccess } from "zod/v3";
import type { SafeParseResult } from "../types/zodTypes.js";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import crypto from "crypto";

type userWalletActionValidationType = SafeParseSuccess<z.infer<typeof userWalletActionValidationSchema>>;

const userWithdrawWalletTransaction = async (cardholderId: string, walletId: string, userWalletActionData: userWalletActionValidationType, selectedWallet: walletDetailsType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        const currentBalance = Number(selectedWallet?.account_balance?.toString()) ?? 0;

        const withdrawAmount = Number(userWalletActionData?.data?.amount?.toString());

        // Check balance
        if (withdrawAmount > currentBalance) {
            throw new BadRequestError("Insufficient wallet balance");
        }

        // Configure updated wallet balance and dates
        const now = new Date();
        const updateInc: Record<string, number> = {
            "wallets_details.$.account_balance": -withdrawAmount,
        };
        const updateSet: Record<string, any> = {};
        // Daily Check (For Reset)
        const daily = selectedWallet.daily_transaction;
        if (!daily || daily.date.toDateString() !== now.toDateString()
        ) {
            updateSet["wallets_details.$.daily_transaction.debit"] = withdrawAmount;
            updateSet["wallets_details.$.daily_transaction.date"] = now;
        } else {
            updateInc["wallets_details.$.daily_transaction.debit"] = withdrawAmount;
        }
        // Monthly Check (For Reset)
        const isSameMonth =
            selectedWallet?.monthly_transaction?.month === now.getMonth() + 1 &&
            selectedWallet?.monthly_transaction?.year === now.getFullYear();

        if (isSameMonth) {
            updateInc["wallets_details.$.monthly_transaction.debit"] = withdrawAmount;
        } else {
            updateSet["wallets_details.$.monthly_transaction.debit"] = withdrawAmount;
            updateSet["wallets_details.$.monthly_transaction.month"] = now.getMonth() + 1;
            updateSet["wallets_details.$.monthly_transaction.year"] = now.getFullYear();
        }
        // Yearly Check (For Reset)
        const isSameYear = selectedWallet?.yearly_transaction?.year === now.getFullYear();

        if (isSameYear) {
            updateInc["wallets_details.$.yearly_transaction.debit"] = withdrawAmount;
        } else {
            updateSet["wallets_details.$.yearly_transaction.debit"] = withdrawAmount;
            updateSet["wallets_details.$.yearly_transaction.year"] = now.getFullYear();
        }

        // Update wallet
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                wallet_id: walletId,
                wallets_details:
                {
                    $elemMatch:
                    {
                        wallet_type: userWalletActionData?.data?.wallet_type,
                        wallet_currency: userWalletActionData?.data?.wallet_currency,
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
            throw new ServiceError("Wallet withdraw failed");
        }

        // Prepare transaction payload
        const transactionPayload = {
            transaction_type: "WITHDRAW",
            transaction_status: "SUCCESS",
            wallet_details: {
                wallet_type: userWalletActionData.data.wallet_type,
                wallet_currency: userWalletActionData.data.wallet_currency
            },
            amount: userWalletActionData.data.amount,
            balance_before: currentBalance,
            balance_after: currentBalance - withdrawAmount,
            reference_id: crypto.randomUUID(),
            remarks: "Wallet loaded",
        };

        // Check Transaction Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletTransactionsValidationSchema>> = userWalletTransactionsValidationSchema.safeParse(transactionPayload);
        if (!validationResult.success) {
            // return res.status(400).json({
            //     status: "SERVICE_ERROR",
            //     message: "Invalid request body",
            //     // errors: validationResult.error.issues.map(issue => issue.message)
            //     // errors: validationResult.error.issues.map(issue => ({
            //     //     [issue.path.join(".")]: issue.message
            //     // }))
            //     errors: z.flattenError(validationResult.error)
            // });
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Transaction entry
        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderId,
                    wallet_id: walletId,
                    transaction_id: crypto.randomUUID(),
                    transaction_type: validationResult?.data?.transaction_type,
                    transaction_status: validationResult?.data?.transaction_status,
                    wallet_details: {
                        wallet_type: validationResult?.data?.wallet_details?.wallet_type,
                        wallet_currency: validationResult?.data?.wallet_details?.wallet_currency,
                    },
                    amount: validationResult.data.amount,
                    balance_before: validationResult?.data?.balance_before,
                    balance_after: validationResult?.data?.balance_after,
                    reference_id: validationResult?.data?.reference_id,
                    remarks: validationResult?.data?.remarks,
                },],

            {
                session: mongoSession,
            }
        );

        await mongoSession.commitTransaction();

        return { status: "SUCCESS", message: "Wallet withdrawn successfully", data: { walletId: updatedWallet.wallet_id, wallets_details: updatedWallet.wallets_details } };

    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "WithdrawWalletTransactionService",
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `WithdrawWalletTransactionService facing issue: ${error.message
            }`
        );

    }

    finally {
        await mongoSession.endSession();
    }

};

export default userWithdrawWalletTransaction;