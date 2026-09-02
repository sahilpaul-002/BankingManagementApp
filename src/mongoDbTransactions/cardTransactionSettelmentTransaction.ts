import mongoose, { Types } from "mongoose";
import { Decimal } from "decimal.js";
import logger from "../utils/logger.js";
import { ServiceError, NotFoundError } from "../utils/AppErrorClass.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";
import { userCardDetailsModel as user_card_details } from "../models/user_card_details.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

interface CardAuthorizationDecodedData {
    userId: string;
    userName: string;
    action: "APPROVE" | "REJECT";
    transactionId: string;
}

export const cardTransactionSettlementTransaction = async (decoded: CardAuthorizationDecodedData, transaction: any) => {
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        const now = new Date();

        // Validate transaction input
        if (!decoded?.transactionId) {
            throw new ServiceError("Transaction ID is required");
        }
        if (decoded.action !== "APPROVE" && decoded.action !== "REJECT") {
            throw new ServiceError("Invalid authorization action");
        }
        if (!Types.ObjectId.isValid(decoded.transactionId)) {
            throw new ServiceError("Invalid transaction ID");
        }

        // Fetch latest card transaction inside transaction
        const latestTransaction = await user_card_transactions.findOne(
            {
                transaction_id: decoded.transactionId,
            },
            null,
            {
                session: mongoSession,
            }
        ).lean();
        if (!latestTransaction) {
            throw new NotFoundError("Card transaction not found");
        }

        // Validate authorization type
        if (latestTransaction.authorization_type !== "HOLD") {
            throw new ServiceError("Only HOLD card transactions can be settled");
        }

        // Validate authorization status
        if (latestTransaction.authorization_status !== "PENDING") {
            throw new ServiceError(`Transaction already ${String(latestTransaction.authorization_status).toLowerCase()}`);
        }

        // Validate transaction status
        if (latestTransaction.transaction_status !== "PENDING") {
            throw new ServiceError(`Transaction already ${String(latestTransaction.transaction_status).toLowerCase()}`);
        }

        // Validate authorization expiry
        if (latestTransaction.authorization_expires_at && now > latestTransaction.authorization_expires_at) {
            throw new ServiceError("Authorization request has expired");
        }

        // Validate authorization user
        if (latestTransaction.cardholder_id && decoded.userId && latestTransaction.cardholder_id.toString() !== decoded.userId.toString()) {
            throw new ServiceError("Authorization user does not match the cardholder");
        }

        // Fetch associated wallet HOLD transaction
        const walletTransaction = await user_wallet_transactions.findOne(
            {
                transaction_id: latestTransaction.transaction_id,
                transaction_type: "HOLD",
                transaction_status: "PENDING",
            },
            null,
            {
                session: mongoSession,
            }
        );
        if (!walletTransaction) {
            throw new NotFoundError("Pending wallet HOLD transaction not found");
        }

        // Validate wallet transaction
        if (walletTransaction.transaction_type !== "HOLD") {
            throw new ServiceError("Associated wallet transaction is not a HOLD transaction");
        }
        if (walletTransaction.transaction_status !== "PENDING") {
            throw new ServiceError(`Wallet transaction already ${String(walletTransaction.transaction_status).toLowerCase()}`);
        }

        // Validate wallet ID
        if (!walletTransaction.wallet_id || !Types.ObjectId.isValid(walletTransaction.wallet_id)) {
            throw new ServiceError("Invalid wallet ID");
        }

        // Fetch wallet
        const wallet = await user_wallet_details.findOne(
            {
                _id: walletTransaction.wallet_id,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: walletTransaction.wallet_details.wallet_type,
                        wallet_currency: walletTransaction.wallet_details.wallet_currency,
                    },
                },
            },
            null,
            {
                session: mongoSession,
            }
        );
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }

        // Find exact wallet details
        const walletData = wallet.wallets_details.find(
            (walletItem: any) =>
                walletItem.wallet_type ===
                walletTransaction.wallet_details
                    .wallet_type &&
                walletItem.wallet_currency ===
                walletTransaction.wallet_details
                    .wallet_currency
        );
        if (!walletData) {
            throw new NotFoundError("Wallet details not found");
        }

        // Convert balances to Decimal.js
        const currentBalance = new Decimal(walletData.account_balance?.toString() ?? "0");
        const currentAvailableBalance = new Decimal(walletData.available_balance?.toString() ?? "0");
        const currentHoldingAmount = new Decimal(walletData.holding_amount?.toString() ?? "0");

        // Validate wallet balances
        if (!currentBalance.isFinite() || !currentAvailableBalance.isFinite() || !currentHoldingAmount.isFinite()) {
            throw new ServiceError("Invalid wallet balance values");
        }
        if (currentBalance.isNegative() || currentAvailableBalance.isNegative() || currentHoldingAmount.isNegative()) {
            throw new ServiceError("Wallet balance cannot be negative");
        }

        // Validate wallet accounting balance
        if (
            !currentBalance.equals(currentAvailableBalance.plus(currentHoldingAmount))) {
            throw new ServiceError("Wallet balance inconsistency detected before card transaction settlement");
        }

        // Validate transaction amount
        const transactionAmount = new Decimal(walletTransaction.amount?.toString() ?? "0");
        if (!transactionAmount.isFinite() || transactionAmount.isNaN() || transactionAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid wallet transaction amount");
        }

        // Validate holding balance
        if (transactionAmount.greaterThan(currentHoldingAmount)) {
            throw new ServiceError("Insufficient holding balance for card transaction settlement");
        }

        // Decimal128 values
        const amountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.toDecimalPlaces(4).toString());
        const negativeAmountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.negated().toDecimalPlaces(4).toString());

        // APPROVE (Only APPROVE consumes card limits)
        if (decoded.action === "APPROVE") {
            // Fetch latest active card
            const cardDetails = await user_card_details.findOne(
                {
                    _id: latestTransaction.card_id,
                    cardholder_id: latestTransaction.cardholder_id,
                    card_status: "ACTIVE",
                },
                null,
                {
                    session: mongoSession,
                }
            ).lean();
            if (!cardDetails) {
                throw new NotFoundError("Card not found or inactive");
            }

            // Read card limits
            const cardDailyLimit = new Decimal(cardDetails.card_limits?.daily_limit?.toString() ?? "0");
            const cardMonthlyLimit = new Decimal(cardDetails.card_limits?.monthly_limit?.toString() ?? "0");
            const cardYearlyLimit = new Decimal(cardDetails.card_limits?.yearly_limit?.toString() ?? "0");
            if (!cardDailyLimit.isFinite() || cardDailyLimit.lessThanOrEqualTo(0)) {
                throw new ServiceError("Invalid card daily limit");
            }
            if (!cardMonthlyLimit.isFinite() || cardMonthlyLimit.lessThanOrEqualTo(0)) {
                throw new ServiceError("Invalid card monthly limit");
            }
            if (!cardYearlyLimit.isFinite() || cardYearlyLimit.lessThanOrEqualTo(0)) {
                throw new ServiceError("Invalid card yearly limit");
            }

            // Current date information
            const currentDay = now.toDateString();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            // Daily transaction
            const dailyTransaction = cardDetails.daily_transaction;
            const isSameDay = !!(dailyTransaction?.date && dailyTransaction.date.toDateString() === currentDay);
            const currentDailyDebit = isSameDay ? new Decimal(dailyTransaction?.debit?.toString() ?? "0") : new Decimal(0);

            // Monthly transaction
            const monthlyTransaction = cardDetails.monthly_transaction;
            const isSameMonth = !!(monthlyTransaction?.month === currentMonth && monthlyTransaction?.year === currentYear);
            const currentMonthlyDebit = isSameMonth ? new Decimal(monthlyTransaction?.debit?.toString() ?? "0") : new Decimal(0);

            // Yearly transaction
            const yearlyTransaction = cardDetails.yearly_transaction;
            const isSameYear = !!(yearlyTransaction?.year === currentYear);
            const currentYearlyDebit = isSameYear ? new Decimal(yearlyTransaction?.debit?.toString() ?? "0") : new Decimal(0);

            // Validate current usage
            if (!currentDailyDebit.isFinite() || currentDailyDebit.isNegative()) {
                throw new ServiceError("Invalid daily transaction debit");
            }
            if (!currentMonthlyDebit.isFinite() || currentMonthlyDebit.isNegative()) {
                throw new ServiceError("Invalid monthly transaction debit");
            }
            if (!currentYearlyDebit.isFinite() || currentYearlyDebit.isNegative()) {
                throw new ServiceError("Invalid yearly transaction debit");
            }

            // Projected usage
            const projectedDailyDebit = currentDailyDebit.plus(transactionAmount);
            const projectedMonthlyDebit = currentMonthlyDebit.plus(transactionAmount);
            const projectedYearlyDebit = currentYearlyDebit.plus(transactionAmount);

            // Check card limits
            let limitExceeded: "DAILY" | "MONTHLY" | "YEARLY" | null = null;
            if (projectedDailyDebit.greaterThan(cardDailyLimit)) {
                limitExceeded = "DAILY";
            }
            else if (projectedMonthlyDebit.greaterThan(cardMonthlyLimit)) {
                limitExceeded = "MONTHLY";
            }
            else if (projectedYearlyDebit.greaterThan(cardYearlyLimit)) {
                limitExceeded = "YEARLY";
            }

            // Handle limit exceeded scenario
            if (limitExceeded) {
                const walletReleaseUpdate = await user_wallet_details.updateOne(
                    {
                        _id: wallet._id,

                        wallets_details: {
                            $elemMatch: {
                                wallet_type: walletData.wallet_type,
                                wallet_currency: walletData.wallet_currency,
                                holding_amount: {
                                    $gte: amountDecimal128,
                                },
                            },
                        },
                    },
                    {
                        $inc: {
                            "wallets_details.$.holding_amount": negativeAmountDecimal128,
                            "wallets_details.$.available_balance": amountDecimal128,
                        },
                    },
                    {
                        session: mongoSession,
                    }
                );
                if (walletReleaseUpdate.modifiedCount !== 1) {
                    throw new ServiceError("Failed to release wallet HOLD after card limit rejection");
                }

                // Mark wallet transaction FAILED
                const walletTransactionUpdate = await user_wallet_transactions.updateOne(
                    {
                        transaction_id: latestTransaction.transaction_id,
                        transaction_status: "PENDING",
                        transaction_type: "HOLD",
                    },
                    {
                        $set: {
                            transaction_status: "FAILED",
                        },
                    },
                    {
                        session: mongoSession,
                    }
                );
                if (walletTransactionUpdate.modifiedCount !== 1) {
                    throw new ServiceError("Failed to update wallet transaction after card limit rejection");
                }

                // Mark card transaction REJECTED / FAILED
                const cardTransactionUpdate = await user_card_transactions.updateOne(
                    {
                        transaction_id: latestTransaction.transaction_id,
                        authorization_status: "PENDING",
                        transaction_status: "PENDING",
                    },
                    {
                        $set: {
                            authorization_status: "REJECTED",
                            transaction_status: "FAILED",
                            authorized_at: null,
                            authorized_by: null,
                        },
                    },
                    {
                        session: mongoSession,
                    }
                );
                if (cardTransactionUpdate.modifiedCount !== 1) {
                    throw new ServiceError("Failed to reject card transaction after card limit rejection");
                }

                // Commit rejection
                await mongoSession.commitTransaction();

                return {
                    status: "SUCCESS",

                    data: {
                        transactionId: latestTransaction.transaction_id.toString(),
                        action: "REJECT",
                        transactionStatus: "FAILED",
                        authorizationStatus: "REJECTED",
                        rejectionReason: `${limitExceeded} card transaction limit exceeded`,
                    },
                };
            }

            // Prepare card limit update
            const cardTransactionAmountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.toDecimalPlaces(4).toString());
            const cardUpdateInc: Record<string, mongoose.Types.Decimal128> = {};
            const cardUpdateSet: Record<string, any> = {};

            // Daily usage update
            if (isSameDay) {
                cardUpdateInc["daily_transaction.debit"] = cardTransactionAmountDecimal128;
            }
            else {
                cardUpdateSet["daily_transaction.debit"] = cardTransactionAmountDecimal128;
                cardUpdateSet["daily_transaction.date"] = now;
            }

            // Monthly usage update
            if (isSameMonth) {
                cardUpdateInc["monthly_transaction.debit"] = cardTransactionAmountDecimal128;
            }
            else {
                cardUpdateSet["monthly_transaction.debit"] = cardTransactionAmountDecimal128;
                cardUpdateSet["monthly_transaction.month"] = currentMonth;
                cardUpdateSet["monthly_transaction.year"] = currentYear;
            }

            // Yearly usage update
            if (isSameYear) {
                cardUpdateInc["yearly_transaction.debit"] = cardTransactionAmountDecimal128;
            }
            else {
                cardUpdateSet["yearly_transaction.debit"] = cardTransactionAmountDecimal128;
                cardUpdateSet["yearly_transaction.year"] = currentYear;
            }

            // Optimistic concurrency filter
            const cardFilter: Record<string, any> = {
                _id: latestTransaction.card_id,
                cardholder_id: latestTransaction.cardholder_id,
                card_status: "ACTIVE",
            };

            if (isSameDay) {
                cardFilter["daily_transaction.debit"] = dailyTransaction?.debit;
            }

            if (isSameMonth) {
                cardFilter["monthly_transaction.debit"] = monthlyTransaction?.debit;
            }
            if (isSameYear) {
                cardFilter["yearly_transaction.debit"] = yearlyTransaction?.debit;
            }

            // Update card limit usage
            const updatedCard = await user_card_details.findOneAndUpdate(
                cardFilter,
                {
                    ...(Object.keys(cardUpdateInc).length > 0
                        ? {
                            $inc: cardUpdateInc,
                        }
                        : {}),

                    ...(Object.keys(cardUpdateSet).length > 0
                        ? {
                            $set: cardUpdateSet,
                        }
                        : {}),
                },
                {
                    new: true,
                    session: mongoSession,
                }
            ).lean();

            if (!updatedCard) {
                throw new ServiceError("Card transaction limit usage changed. Please retry authorization.");
            }
        }

        // ---------------------------------------------------------------------
        // Wallet settlement
        //
        // APPROVE:
        // holding_amount -= amount
        // account_balance -= amount
        //
        // REJECT:
        // holding_amount -= amount
        // available_balance += amount
        // ---------------------------------------------------------------------
        const walletUpdateInc: Record<string, mongoose.Types.Decimal128> = {};
        if (decoded.action === "APPROVE") {
            walletUpdateInc["wallets_details.$.holding_amount"] = negativeAmountDecimal128;
            walletUpdateInc["wallets_details.$.account_balance"] = negativeAmountDecimal128;
        }
        else {
            walletUpdateInc["wallets_details.$.holding_amount"] = negativeAmountDecimal128;
            walletUpdateInc["wallets_details.$.available_balance"] = amountDecimal128;
        }

        // Update wallet
        const walletUpdate = await user_wallet_details.updateOne(
            {
                _id: wallet._id,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: walletData.wallet_type,
                        wallet_currency: walletData.wallet_currency,
                        holding_amount: {
                            $gte: amountDecimal128,
                        },
                    },
                },
            },
            {
                $inc: walletUpdateInc,
            },
            {
                session: mongoSession,
            }
        );
        if (walletUpdate.modifiedCount !== 1) {
            throw new ServiceError("Failed to update wallet during card transaction settlement");
        }

        // Update wallet transaction
        const walletTransactionUpdate = await user_wallet_transactions.updateOne(
            {
                transaction_id: latestTransaction.transaction_id,
                transaction_status: "PENDING",
                transaction_type: "HOLD",
            },
            {
                $set: {
                    transaction_status: decoded.action === "APPROVE" ? "SUCCESS" : "FAILED",
                },
            },
            {
                session: mongoSession,
            }
        );
        if (walletTransactionUpdate.modifiedCount !== 1) {
            throw new ServiceError("Failed to update wallet transaction");
        }

        // Update card transaction
        const cardTransactionUpdate = decoded.action === "APPROVE" ? {
            authorization_status: "AUTHORIZED",
            transaction_status: "SUCCESS",
            authorized_at: now,
            authorized_by: decoded.userName || decoded.userId,
        } : {
            authorization_status: "REJECTED",
            transaction_status: "FAILED",
            authorized_at: null,
            authorized_by: null,
        };

        // Final card transaction update
        const cardUpdate = await user_card_transactions.updateOne(
            {
                transaction_id: latestTransaction.transaction_id,
                authorization_status: "PENDING",
                transaction_status: "PENDING",
                $or: [
                    {
                        authorization_expires_at: null,
                    },
                    {
                        authorization_expires_at: { $gt: now, },
                    },
                ],
            },
            {
                $set: cardTransactionUpdate,
            },
            {
                session: mongoSession,
            }
        );
        if (cardUpdate.modifiedCount !== 1) {
            throw new ServiceError("Failed to update card transaction");
        }

        // Commit transaction
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            data: {
                transactionId: latestTransaction.transaction_id.toString(),
                action: decoded.action,
                transactionStatus: decoded.action === "APPROVE" ? "SUCCESS" : "FAILED",
                authorizationStatus: decoded.action === "APPROVE" ? "AUTHORIZED" : "REJECTED",
            },
        };

    }
    catch (err: any) {
        // Abort transaction if still active
        if (mongoSession.inTransaction()) {
            try {
                await mongoSession.abortTransaction();
            }
            catch (abortError) {
                logger.error("Failed to abort card transaction settlement", abortError);
            }
        }

        // Log error
        logger.error("Card transaction settlement failed", err);

        // Sanitize and rethrow
        throw sanitizeApiError(err);

    }
    finally {
        // End MongoDB session

        await mongoSession.endSession();
    }
};

export default cardTransactionSettlementTransaction;