import mongoose from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";
import z from "zod";
import type { SafeParseSuccess } from "zod/v3";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";

type userWalletActionValidationType = SafeParseSuccess<z.infer<typeof userWalletActionValidationSchema>>;

const userLoadWalletTransaction = async (cardholderId: string, walletId: string, userWalletActionData: userWalletActionValidationType, selectedWallet: walletDetailsType) => {
    const mongoSession =
        await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Configure updated wallet balance and dates
        const loadAmount = userWalletActionData.data.amount;
        const now = new Date();
        const updateInc: Record<string, number> = {"wallets_details.$.account_balance": loadAmount};
        const updateSet: Record<string, any> = {};
        // Daily
        const daily = selectedWallet.daily_transaction;
        if (!daily?.date || daily.date.toDateString() !== now.toDateString()) {
            updateSet["wallets_details.$.daily_transaction.credit"] = loadAmount;
            updateSet["wallets_details.$.daily_transaction.date"] = now;
        } 
        else {
            updateInc["wallets_details.$.daily_transaction.credit"] = loadAmount;
        }
        // Monthly
        const isSameMonth = selectedWallet.monthly_transaction?.month === now.getMonth() + 1 &&
            selectedWallet.monthly_transaction?.year === now.getFullYear();

        if (isSameMonth) {
            updateInc["wallets_details.$.monthly_transaction.credit"] = loadAmount;
        } 
        else {
            updateSet["wallets_details.$.monthly_transaction.credit"] = loadAmount;
            updateSet["wallets_details.$.monthly_transaction.month"] = now.getMonth() + 1;
            updateSet["wallets_details.$.monthly_transaction.year"] = now.getFullYear();
        }

        // Yearly
        const isSameYear = selectedWallet.yearly_transaction?.year === now.getFullYear();

        if (isSameYear) {
            updateInc["wallets_details.$.yearly_transaction.credit"] = loadAmount;
        } 
        else {
            updateSet["wallets_details.$.yearly_transaction.credit"] = loadAmount;
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
                        wallet_type: userWalletActionData.data.wallet_type,
                        wallet_currency: userWalletActionData.data.wallet_currency,
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
            throw new ServiceError("Wallet update failed");
        }

        // Prepare transaction payload
        const transactionPayload = {
            transaction_type: "LOAD",
            transaction_status: "SUCCESS",
            wallet_details: {
                wallet_type: userWalletActionData.data.wallet_type,
                wallet_currency: userWalletActionData.data.wallet_currency
            },
            amount: userWalletActionData.data.amount,
            balance_before: selectedWallet.account_balance ?? 0,
            balance_after: (Number(selectedWallet?.account_balance?.toString()) ?? 0) + userWalletActionData.data.amount,
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

        // Create load transaction entry
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
                },
            ],
            {
                session: mongoSession,
            }
        );

        await mongoSession.commitTransaction();

        const walletDetails = {
            walletId: updatedWallet?.wallet_id,
            wallets_details: updatedWallet?.wallets_details
        }

        return { status: "SUCCESS", message: "Wallet loaded successfully", data: walletDetails }
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "LoadWalletTransactionService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `LoadWalletTransactionService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );

    }
    finally {
        await mongoSession.endSession();
    }
}

export default userLoadWalletTransaction;