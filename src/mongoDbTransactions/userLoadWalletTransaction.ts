import mongoose from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import userWalletLoadValidationSchema from "../validations/userWalletLoadValidation.js";
import type z from "zod";
import type { SafeParseSuccess } from "zod/v3";

type userWalletLoadValidationType = SafeParseSuccess<z.infer<typeof userWalletLoadValidationSchema> >;

const userLoadWalletTransaction = async (walletId: string, validationResult: userWalletLoadValidationType, selectedWallet: walletDetailsType) => {
    const mongoSession =
        await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Update wallet
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                wallet_id: walletId,
                wallets_details:
                {
                    $elemMatch:
                    {
                        wallet_type: validationResult.data.wallet_type,
                        wallet_currency: validationResult.data.wallet_currency,
                    },
                },
            },
            {
                $inc: {
                    "wallets_details.$.account_balance": validationResult.data.amount,
                },
            },
            {
                new: true,
                session: mongoSession,
            }
        ).lean();

        if (!updatedWallet) {
            throw new ServiceError("Wallet update failed");
        }
        
        // Create transaction entry
        await user_wallet_transactions.create(
            [
                {
                    wallet_id: walletId,
                    transaction_id: crypto.randomUUID(),
                    transaction_type: "LOAD",
                    transaction_status: "SUCCESS",
                    wallet_details: {
                        wallet_type: validationResult.data.wallet_type,
                        wallet_currency: validationResult.data.wallet_currency,
                    },
                    amount: validationResult.data.amount,
                    balance_before: selectedWallet.account_balance ?? 0,

                    balance_after: (selectedWallet.account_balance ?? 0) + validationResult.data.amount,
                    remarks:
                        "Wallet loaded",
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