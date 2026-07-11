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

type userWalletActionValidationType = SafeParseSuccess<z.infer<typeof userWalletActionValidationSchema>>;

const userWithdrawWalletTransaction = async (walletId: string, userWalletActionData: userWalletActionValidationType, selectedWallet: walletDetailsType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        const currentBalance = selectedWallet.account_balance ?? 0;

        const withdrawAmount = userWalletActionData?.data?.amount;

        // Check balance
        if (withdrawAmount > currentBalance) {
            throw new BadRequestError("Insufficient wallet balance");
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
                $inc:
                {
                    "wallets_details.$.account_balance": -withdrawAmount,
                },
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