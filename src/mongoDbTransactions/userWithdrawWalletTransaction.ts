import mongoose, { Types } from "mongoose";
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
import { Decimal } from "decimal.js";

type userWalletActionValidationType = SafeParseSuccess<z.infer<typeof userWalletActionValidationSchema>>;

const userWithdrawWalletTransaction = async (userId: Types.ObjectId, cardholderId: Types.ObjectId, walletId: Types.ObjectId, userWalletActionData: userWalletActionValidationType, selectedWallet: walletDetailsType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        const withdrawAmount = new Decimal(userWalletActionData.data.amount.toString());
        if (!withdrawAmount.isFinite() || withdrawAmount.lte(0)) {
            throw new BadRequestError("Withdrawal amount must be greater than zero");
        }

        const currentBalance = new Decimal(selectedWallet.account_balance?.toString() ?? "0");
        if (!currentBalance.isFinite() || currentBalance.lt(0)) {
            throw new ServiceError("Invalid wallet balance");
        }

        // Check balance
        if (withdrawAmount.gt(currentBalance)) {
            throw new BadRequestError("Insufficient wallet balance");
        }

        const balanceAfter = currentBalance.minus(withdrawAmount).toDecimalPlaces(18);
        const withdrawAmountDecimal128 = mongoose.Types.Decimal128.fromString(withdrawAmount.toDecimalPlaces(18).toString());
        const negativeWithdrawAmountDecimal128 = mongoose.Types.Decimal128.fromString(withdrawAmount.negated().toDecimalPlaces(18).toString());
        const currentBalanceDecimal128 = mongoose.Types.Decimal128.fromString(currentBalance.toDecimalPlaces(18).toString());
        const balanceAfterDecimal128 = mongoose.Types.Decimal128.fromString(balanceAfter.toDecimalPlaces(18).toString());

        const now = new Date();

        // Configure updated wallet balance and dates
        const updateInc: Record<string, mongoose.Types.Decimal128> = {
            "wallets_details.$.account_balance":
                negativeWithdrawAmountDecimal128
        };

        const updateSet: Record<string, any> = {};

        // Daily Transaction Check (For Reset)
        const daily = selectedWallet.daily_transaction;
        if (!daily?.date || daily.date.toDateString() !== now.toDateString()) {
            updateSet[
                "wallets_details.$.daily_transaction.debit"
            ] = withdrawAmountDecimal128;

            updateSet[
                "wallets_details.$.daily_transaction.date"
            ] = now;
        }
        else {
            updateInc[
                "wallets_details.$.daily_transaction.debit"
            ] = withdrawAmountDecimal128;
        }

        // Monthly Transaction Check (For Reset)
        const isSameMonth = selectedWallet.monthly_transaction?.month === now.getMonth() + 1 && selectedWallet.monthly_transaction?.year === now.getFullYear();
        if (isSameMonth) {
            updateInc[
                "wallets_details.$.monthly_transaction.debit"
            ] = withdrawAmountDecimal128;
        }
        else {
            updateSet[
                "wallets_details.$.monthly_transaction.debit"
            ] = withdrawAmountDecimal128;

            updateSet[
                "wallets_details.$.monthly_transaction.month"
            ] = now.getMonth() + 1;

            updateSet[
                "wallets_details.$.monthly_transaction.year"
            ] = now.getFullYear();
        }

        // Yearly Transaction Check (For Reset)
        const isSameYear = selectedWallet.yearly_transaction?.year === now.getFullYear();
        if (isSameYear) {
            updateInc[
                "wallets_details.$.yearly_transaction.debit"
            ] = withdrawAmountDecimal128;
        }
        else {
            updateSet[
                "wallets_details.$.yearly_transaction.debit"
            ] = withdrawAmountDecimal128;

            updateSet[
                "wallets_details.$.yearly_transaction.year"
            ] = now.getFullYear();
        }

        // Update wallet
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                _id: walletId,
                user_id: userId,
                cardholder_id: cardholderId,

                wallets_details: {
                    $elemMatch: {
                        wallet_type:
                            userWalletActionData.data.wallet_type,

                        wallet_currency:
                            userWalletActionData.data.wallet_currency
                    }
                }
            },

            {
                $inc: updateInc,
                $set: updateSet
            },

            {
                new: true,
                session: mongoSession
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
            amount: Number(withdrawAmount.toString()),
            balance_before: Number(currentBalance.toString()),
            balance_after: Number(balanceAfter.toString()),
            reference_id: crypto.randomUUID(),
            remarks: "Wallet withdrawn",
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
                    transaction_id: new Types.ObjectId(),
                    transaction_type: validationResult.data.transaction_type,
                    transaction_status: validationResult.data.transaction_status,
                    wallet_details: {
                        wallet_type: validationResult.data.wallet_details?.wallet_type,
                        wallet_currency: validationResult.data.wallet_details?.wallet_currency
                    },
                    amount: withdrawAmountDecimal128,
                    balance_before: currentBalanceDecimal128,
                    balance_after: balanceAfterDecimal128,
                    reference_id: validationResult.data.reference_id,
                    remarks: validationResult.data.remarks
                }
            ],
            {
                session: mongoSession
            }
        );


        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS", message: "Wallet withdrawn successfully",
            data: {
                walletId: updatedWallet._id,
                wallets_details: updatedWallet.wallets_details,
                amount: withdrawAmount.toString(),
                balance_before: currentBalance.toString(),
                balance_after: balanceAfter.toString()
            }
        };

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