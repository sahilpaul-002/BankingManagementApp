import mongoose from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import {AppErrorClass, ServiceError, BadRequestError} from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import userWalletLoadValidationSchema from "../validations/userWalletLoadValidation.js";
import type z from "zod";

import type {SafeParseSuccess} from "zod/v3";

type userWalletWithdrawValidationType = SafeParseSuccess<z.infer<typeof userWalletLoadValidationSchema>>;

const userWithdrawWalletTransaction = async (walletId: string, validationResult: userWalletWithdrawValidationType, selectedWallet: walletDetailsType) => {
        const mongoSession = await mongoose.startSession();
        try {
            mongoSession.startTransaction();

            const currentBalance = selectedWallet.account_balance ?? 0;

            const withdrawAmount = validationResult.data.amount;

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
                                wallet_type: validationResult.data.wallet_type,
                                wallet_currency: validationResult.data.wallet_currency,
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
                throw new ServiceError( "Wallet withdraw failed" );
            }

            // Transaction entry
            await user_wallet_transactions.create(
                [
                    {
                        wallet_id: walletId,
                        transaction_id: crypto.randomUUID(),
                        transaction_type: "WITHDRAW",
                        transaction_status: "SUCCESS",
                        wallet_details:
                        {
                            wallet_type: validationResult.data.wallet_type,
                            wallet_currency: validationResult.data.wallet_currency,
                        },
                        amount: withdrawAmount,
                        balance_before: currentBalance,
                        balance_after: currentBalance - withdrawAmount,
                        remarks: "Wallet withdrawal",
                    },
                ],

                {
                    session: mongoSession,
                }
            );

            await mongoSession.commitTransaction();

            return {status:"SUCCESS", message: "Wallet withdrawn successfully", data: {walletId: updatedWallet.wallet_id, wallets_details: updatedWallet.wallets_details}};

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