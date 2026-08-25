import mongoose from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { fiatPayoutTransactionsModel as fiat_payout_transactions } from "../models/fiat_payout_transactions.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import { Decimal } from "decimal.js";
import crypto from "crypto";
import sanitizeApiError from "../utils/sanitizeApiError.js";

type bankPayoutProcessingTransactionData = {
    payoutTransactionId: string;
};

const bankPayoutProcessingTransaction = async (transactionData: bankPayoutProcessingTransactionData) => {

    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        const { payoutTransactionId } = transactionData;

        // --------------------------------------------------
        // Get payout transaction
        // --------------------------------------------------
        const payoutTransaction = await fiat_payout_transactions.findOne(
                {
                    _id: payoutTransactionId,
                    status: "PROCESSING",
                }
            ).session(mongoSession);

        if (!payoutTransaction) {
            throw new ServiceError("Payout transaction not found or is no longer processing");
        }

        // --------------------------------------------------
        // Prepare payout amount
        // --------------------------------------------------
        const payoutAmount = new Decimal(payoutTransaction.source_amount?.toString() ?? "0");

        if (payoutAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid payout source amount");
        }

        // --------------------------------------------------
        // Get wallet
        // --------------------------------------------------
        const walletDetails = await user_wallet_details.findOne(
            {
                user_id: payoutTransaction.user_id,
                wallet_id: payoutTransaction.wallet_id,
            }
        ).session(mongoSession);

        if (!walletDetails) {
            throw new ServiceError("User wallet details not found");
        }

        // --------------------------------------------------
        // Find source wallet
        // --------------------------------------------------
        const sourceWalletIndex =
            walletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency === payoutTransaction.source_currency &&
                    wallet.wallet_status === "ACTIVE"
            );

        if (sourceWalletIndex === -1) {
            throw new ServiceError(
                `Active ${payoutTransaction.source_currency} fiat wallet not found`
            );
        }

        const sourceWallet = walletDetails.wallets_details[sourceWalletIndex];
        if (!sourceWallet) {
            throw new ServiceError(`Source wallet details not found for ${payoutTransaction.source_currency}`);
        }

        // --------------------------------------------------
        // Current wallet balances
        // --------------------------------------------------
        const currentAccountBalance = new Decimal(sourceWallet.account_balance?.toString() ?? "0");

        const currentHoldingAmount = new Decimal(sourceWallet.holding_amount?.toString() ?? "0");

        // --------------------------------------------------
        // Validate held amount
        // --------------------------------------------------
        if (currentHoldingAmount.lessThan(payoutAmount)) {
            throw new ServiceError("Insufficient holding amount to complete payout");
        }

        // --------------------------------------------------
        // Calculate final balances
        // --------------------------------------------------
        const newAccountBalance = currentAccountBalance.minus(payoutAmount);

        const newHoldingAmount = currentHoldingAmount.minus(payoutAmount);

        if (newAccountBalance.lessThan(0)) {
            throw new ServiceError("Account balance cannot become negative");
        }

        // --------------------------------------------------
        // Calculate transaction totals
        // --------------------------------------------------
        const now = new Date();

        const updateInc: Record<string, number> = {
            [`wallets_details.${sourceWalletIndex}.account_balance`]:
                -Number(payoutAmount.toFixed(2)),
        };

        const updateSet: Record<string, any> = {
            [`wallets_details.${sourceWalletIndex}.holding_amount`]:
                newHoldingAmount.toFixed(2),
        };

        // --------------------------------------------------
        // Daily transaction
        // --------------------------------------------------
        const daily = sourceWallet.daily_transaction;

        if (!daily || daily.date.toDateString() !== now.toDateString()) {
            updateSet[
                `wallets_details.${sourceWalletIndex}.daily_transaction.debit`
            ] = payoutAmount.toFixed(2);

            updateSet[
                `wallets_details.${sourceWalletIndex}.daily_transaction.date`
            ] = now;

        } else {
            updateInc[
                `wallets_details.${sourceWalletIndex}.daily_transaction.debit`
            ] = Number(payoutAmount.toFixed(2));
        }

        // --------------------------------------------------
        // Monthly transaction
        // --------------------------------------------------
        const isSameMonth = sourceWallet.monthly_transaction?.month === now.getMonth() + 1 && sourceWallet.monthly_transaction?.year === now.getFullYear();
        if (isSameMonth) {
            updateInc[
                `wallets_details.${sourceWalletIndex}.monthly_transaction.debit`
            ] = Number(payoutAmount.toFixed(2));

        } else {
            updateSet[
                `wallets_details.${sourceWalletIndex}.monthly_transaction.debit`
            ] = payoutAmount.toFixed(2);

            updateSet[
                `wallets_details.${sourceWalletIndex}.monthly_transaction.month`
            ] = now.getMonth() + 1;

            updateSet[
                `wallets_details.${sourceWalletIndex}.monthly_transaction.year`
            ] = now.getFullYear();
        }

        // --------------------------------------------------
        // Yearly transaction
        // --------------------------------------------------
        const isSameYear = sourceWallet.yearly_transaction?.year === now.getFullYear();
        if (isSameYear) {
            updateInc[
                `wallets_details.${sourceWalletIndex}.yearly_transaction.debit`
            ] = Number(payoutAmount.toFixed(2));

        } else {

            updateSet[
                `wallets_details.${sourceWalletIndex}.yearly_transaction.debit`
            ] = payoutAmount.toFixed(2);

            updateSet[
                `wallets_details.${sourceWalletIndex}.yearly_transaction.year`
            ] = now.getFullYear();
        }

        // --------------------------------------------------
        // Update wallet
        // --------------------------------------------------
        const walletUpdateResult = await user_wallet_details.updateOne(
                {
                    _id: walletDetails._id,
                },
                {
                    $inc: updateInc,
                    $set: updateSet,
                },
                {
                    session: mongoSession,
                }
            );

        if (walletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError(
                "Failed to finalize payout wallet balance"
            );
        }

        // --------------------------------------------------
        // Generate provider reference
        // --------------------------------------------------
        const providerReference = `MOCK-BANK-${crypto.randomUUID()}`;

        // --------------------------------------------------
        // Update payout transaction
        // --------------------------------------------------
        const payoutUpdateResult = await fiat_payout_transactions.updateOne(
                {
                    _id: payoutTransaction._id,
                    status: "PROCESSING",
                },
                {
                    $set: {
                        status: "SUCCESS",
                        completed_at: now,
                        provider_reference: providerReference,
                        remarks: "Payout successfully completed by mock external bank",
                    },
                },
                {
                    session: mongoSession,
                }
            );
        if (payoutUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Failed to update payout transaction status");
        }

        // --------------------------------------------------
        // Update wallet transaction
        // --------------------------------------------------
        const walletTransaction = await user_wallet_transactions.findOne(
                {
                    wallet_id: payoutTransaction.wallet_id,
                    reference_id: payoutTransaction._id.toString(),
                    transaction_type: "HOLD",
                    transaction_status: "PENDING",
                }
            ).session(mongoSession);
        if (!walletTransaction) {
            throw new ServiceError("Pending wallet HOLD transaction not found");
        }

        const walletTransactionUpdateResult =
            await user_wallet_transactions.updateOne(
                {
                    _id: walletTransaction._id,
                    transaction_type: "HOLD",
                    transaction_status: "PENDING",
                },
                {
                    $set: {
                        transaction_status: "SUCCESS",
                        balance_after:
                            newAccountBalance.toFixed(2),
                        remarks:
                            "Payout successfully completed and wallet amount debited",
                    },
                },
                {
                    session: mongoSession,
                }
            );
        if (walletTransactionUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Failed to update wallet HOLD transaction");
        }

        // --------------------------------------------------
        // Commit
        // --------------------------------------------------
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            data: {
                payout_transaction_id:
                    payoutTransaction._id.toString(),

                provider_reference:
                    providerReference,

                source_amount:
                    payoutTransaction.source_amount,

                status: "SUCCESS",
            },
        };

    } catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "CompletePayoutTransaction",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CompletePayoutTransaction facing issue`, sanitizedError);
    } finally {

        await mongoSession.endSession();

    }
};

export default bankPayoutProcessingTransaction;