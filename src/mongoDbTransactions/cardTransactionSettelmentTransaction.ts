import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, NotFoundError } from "../utils/AppErrorClass.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import { Decimal } from "decimal.js";
import { userCardDetailsModel as user_card_details } from "../models/user_card_details.js";

const cardTransactionSettlementTransaction = async (
    decoded: {
        userId: string;
        userName: string;
        action: "APPROVE" | "REJECT";
        transactionId: string;
    },
    transaction: any
) => {
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        const now = new Date();

        const latestTransaction = await user_card_transactions.findOne(
            {
                transaction_id: transaction.transaction_id,
            },
            null,
            {
                session: mongoSession,
            }
        ).lean();
        if (!latestTransaction) {
            throw new NotFoundError("Card transaction not found");
        }
        // Prevent duplicate processing
        if (latestTransaction.authorization_status !== "PENDING") {
            throw new ServiceError(`Transaction already ${latestTransaction.authorization_status.toLowerCase()}`);
        }

        // Check authorization expiry
        if (latestTransaction.authorization_expires_at && now > latestTransaction.authorization_expires_at) {
            throw new ServiceError("Authorization request has expired");
        }

        // Get Wallet Transaction
        const walletTransaction = await user_wallet_transactions.findOne(
            {
                transaction_id: transaction.transaction_id,
            },
            null,
            {
                session: mongoSession,
            }
        );
        if (!walletTransaction) {
            throw new NotFoundError("Wallet transaction not found");
        }
        // Validate wallet transaction
        if (walletTransaction.transaction_type !== "HOLD") {
            throw new ServiceError("Associated wallet transaction is not a HOLD transaction");
        }
        if (walletTransaction.transaction_status !== "PENDING") {
            throw new ServiceError(`Wallet transaction already ${walletTransaction.transaction_status.toLowerCase()}`);
        }
        if (latestTransaction.authorization_type !== "HOLD") {
            throw new ServiceError("Only HOLD card transactions can be settled");
        }

        // Get Wallet
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
        // Get selected wallet
        const walletData = wallet.wallets_details.find(
            (x) =>
                x.wallet_type === walletTransaction.wallet_details.wallet_type && x.wallet_currency === walletTransaction.wallet_details.wallet_currency
        );
        if (!walletData) {
            throw new NotFoundError("Wallet details not found");
        }
        const currentBalance = new Decimal(walletData.account_balance?.toString() ?? "0");
        const currentAvailableBalance = new Decimal(walletData.available_balance?.toString() ?? "0");
        const currentHoldingAmount = new Decimal(walletData.holding_amount?.toString() ?? "0");
        // Validate walllet balance accounting
        if (!currentBalance.equals(currentAvailableBalance.plus(currentHoldingAmount))) {
            throw new ServiceError("Wallet balance inconsistency detected before card transaction settlement");
        }

        // Get Transaciton Amount
        const transactionAmount = new Decimal(walletTransaction.amount.toString());
        if (!transactionAmount.isFinite() || transactionAmount.isNegative() || transactionAmount.isZero()) {
            throw new ServiceError("Invalid wallet transaction amount");
        }
        const amountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.toDecimalPlaces(4).toString());
        const negativeAmountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.negated().toDecimalPlaces(4).toString());

        // Validate HOLD amount
        if (transactionAmount.greaterThan(currentHoldingAmount)) {
            throw new ServiceError("Insufficient holding balance for card transaction settlement");
        }

        const updateInc: Record<string, mongoose.Types.Decimal128> = {};
        let cardTransactionUpdate: Record<string, any>;

        // Approve Card Transaction Settlement
        if (decoded.action === "APPROVE") {
            updateInc["wallets_details.$.holding_amount"] = negativeAmountDecimal128;
            updateInc["wallets_details.$.account_balance"] = negativeAmountDecimal128;
            cardTransactionUpdate = {
                authorization_status: "AUTHORIZED",
                transaction_status: "SUCCESS",
                authorized_at: new Date(),
                authorized_by: decoded.userName || decoded.userId,
            };
        }

        // Reject Card Transaction Settlement
        else {
            updateInc["wallets_details.$.holding_amount"] = negativeAmountDecimal128;
            updateInc["wallets_details.$.available_balance"] = amountDecimal128;
            cardTransactionUpdate = {
                authorization_status: "REJECTED",
                transaction_status: "FAILED",
                authorized_at: new Date(),
                authorized_by: decoded.userName || decoded.userId,
            };
        }

        // Update Wallet
        const walletUpdate = await user_wallet_details.updateOne(
            {
                _id: wallet._id,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: walletData.wallet_type,
                        wallet_currency: walletData.wallet_currency,
                    },
                },
            },
            {
                $inc: updateInc,
            },
            {
                session: mongoSession,
            }
        );
        if (walletUpdate.modifiedCount !== 1) {
            throw new ServiceError("Failed to update wallet");
        }

        // Reverse card limit usage on REJECT
        if (decoded.action === "REJECT") {
            const transactionCreatedAt = new Date(latestTransaction.createdAt);
            const isSameDay = transactionCreatedAt.toDateString() === now.toDateString();
            const isSameMonth = transactionCreatedAt.getFullYear() === now.getFullYear() && transactionCreatedAt.getMonth() === now.getMonth();
            const isSameYear = transactionCreatedAt.getFullYear() === now.getFullYear();
            const cardLimitFilter: Record<string, any> = {
                _id: latestTransaction.card_id,
                cardholder_id: latestTransaction.cardholder_id,
                card_status: "ACTIVE",
            };
            const cardLimitInc: Record<string, mongoose.Types.Decimal128> = {};

            // Get the transaction amount that was originally used
            // for card limit calculation.
            const negativeTransactionAmountDecimal128 = mongoose.Types.Decimal128.fromString(transactionAmount.negated().toDecimalPlaces(4).toString());

            // Daily limit
            if (isSameDay) {
                cardLimitInc["daily_transaction.debit"] = negativeTransactionAmountDecimal128;
            }

            // Monthly limit
            if (isSameMonth) {
                cardLimitInc["monthly_transaction.debit"] = negativeTransactionAmountDecimal128;
            }

            // Yearly limit
            if (isSameYear) {
                cardLimitInc["yearly_transaction.debit"] = negativeTransactionAmountDecimal128;
            }

            // Update card limit usage
            if (Object.keys(cardLimitInc).length > 0) {
                const cardLimitUpdate = await user_card_details.updateOne(
                    cardLimitFilter,
                    {
                        $inc: cardLimitInc,
                    },
                    {
                        session: mongoSession,
                    }
                );

                if (cardLimitUpdate.modifiedCount !== 1) {
                    throw new ServiceError("Failed to reverse card limit usage");
                }
            }
        }

        // Update Wallet Transactions
        const walletTransactionUpdate = await user_wallet_transactions.updateOne(
            {
                transaction_id: latestTransaction.transaction_id,
                transaction_status: "PENDING",
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

        // Update Card Transaction
        const cardUpdate = await user_card_transactions.updateOne(
            {
                transaction_id: latestTransaction.transaction_id,
                authorization_status: "PENDING",
            },
            {
                $set: cardTransactionUpdate,
            },
            {
                session: mongoSession,
            }
        );

        if (cardUpdate.modifiedCount !== 1) {
            throw new ServiceError(
                "Failed to update card transaction"
            );
        }

        // -----------------------------------------------------

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
    } catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, { serviceName: "CardTransactionSettlementTransaction" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CardTransactionSettlementTransaction failed`, sanitizedError);
    }
    finally {
        await mongoSession.endSession();
    }
};

export default cardTransactionSettlementTransaction;