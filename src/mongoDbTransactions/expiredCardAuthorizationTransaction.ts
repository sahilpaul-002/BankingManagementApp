import mongoose from "mongoose";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import { Decimal } from "decimal.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

type ExpireCardTransactionAuthorizationData = {
    transactionId: string;
};

const expireCardAuthorizationTransaction = async (transactionData: ExpireCardTransactionAuthorizationData) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        const { transactionId } = transactionData;

        // --------------------------------------------------
        // Get card transaction
        // --------------------------------------------------
        const cardTransaction = await user_card_transactions.findOne(
                {
                    transaction_id: transactionId,
                    authorization_status: "PENDING",
                    authorization_expires_at: {
                        $lte: new Date(),
                    },
                }
            ).session(mongoSession);

        if (!cardTransaction) {
            throw new ServiceError("Card transaction is not pending or has not expired");
        }

        // --------------------------------------------------
        // Prepare amount
        // --------------------------------------------------
        const transactionAmount = new Decimal(cardTransaction.amount?.toString() ?? "0");

        if (transactionAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid card transaction amount");
        }

        // --------------------------------------------------
        // Find wallet
        // --------------------------------------------------
        const walletDetails = await user_wallet_details.findOne(
                {
                    cardholder_id: cardTransaction.cardholder_id
                }
            ).session(mongoSession);

        if (!walletDetails) {
            throw new ServiceError("User wallet details not found");
        }

        // --------------------------------------------------
        // Find wallet
        // --------------------------------------------------
        const walletIndex = walletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency ===
                    cardTransaction.currency &&
                    wallet.wallet_status === "ACTIVE"
            );
        if (walletIndex === -1) {
            throw new ServiceError(
                `Active ${cardTransaction.currency} wallet not found`
            );
        }

        const wallet = walletDetails.wallets_details[walletIndex];
        if (!wallet) {
            throw new ServiceError(
                `Active ${cardTransaction.currency} wallet not found`
            );
        }

        // --------------------------------------------------
        // Current holding amount
        // --------------------------------------------------
        const currentHoldingAmount = new Decimal(
            wallet.holding_amount?.toString() ?? "0"
        );

        // --------------------------------------------------
        // Make sure the held amount exists
        // --------------------------------------------------
        if (currentHoldingAmount.lessThan(transactionAmount)) {
            throw new ServiceError(
                "Insufficient holding amount to release card transaction hold"
            );
        }

        // --------------------------------------------------
        // Calculate new holding amount
        // --------------------------------------------------
        const newHoldingAmount = currentHoldingAmount.minus(transactionAmount);

        // --------------------------------------------------
        // Update wallet
        // --------------------------------------------------
        const walletUpdateResult = await user_wallet_details.updateOne(
                {
                    _id: walletDetails._id,
                    wallets_details: {
                        $elemMatch: {
                            wallet_type: "FIAT",
                            wallet_currency: cardTransaction.currency,
                            wallet_status: "ACTIVE",
                            // Concurrency protection
                            holding_amount: wallet.holding_amount,
                        },
                    },
                },
                {
                    $set: {
                        [`wallets_details.${walletIndex}.holding_amount`]:
                            newHoldingAmount.toFixed(2),
                    },
                },
                {
                    session: mongoSession,
                }
            );

        if (walletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Wallet holding amount changed before card authorization expired");
        }

        // --------------------------------------------------
        // Update card transaction
        // --------------------------------------------------
        //
        // PENDING
        //    ↓
        // EXPIRED
        //
        // transaction status:
        // PENDING
        //    ↓
        // FAILED
        //
        // --------------------------------------------------
        const cardTransactionUpdateResult = await user_card_transactions.updateOne(
                {
                    _id: cardTransaction._id,
                    // Important concurrency protection
                    authorization_status: "PENDING",
                    authorization_expires_at: {
                        $lte: new Date(),
                    },
                },
                {
                    $set: {
                        authorization_status: "EXPIRED",
                        transaction_status: "FAILED",
                        remarks: "Card transaction authorization expired and wallet hold was released",
                    },
                },
                {
                    session: mongoSession,
                }
            );

        if (cardTransactionUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Card transaction was already processed");
        }

        // --------------------------------------------------
        // Find wallet HOLD transaction
        // --------------------------------------------------
        const walletTransaction = await user_wallet_transactions.findOne(
                {
                    cardholder_id: cardTransaction.cardholder_id,
                    reference_id: cardTransaction.transaction_id,
                    transaction_type: "HOLD",
                    transaction_status: "PENDING",
                }
            ).session(mongoSession);

        if (!walletTransaction) {
            throw new ServiceError("Pending wallet HOLD transaction not found");
        }

        // --------------------------------------------------
        // Update wallet HOLD transaction
        // --------------------------------------------------
        const walletTransactionUpdateResult = await user_wallet_transactions.updateOne(
                {
                    _id: walletTransaction._id,
                    transaction_type: "HOLD",
                    transaction_status: "PENDING",
                },
                {
                    $set: {
                        transaction_status: "FAILED",
                        balance_after: walletTransaction.balance_before,
                        remarks: "Card transaction authorization expired and wallet hold was released",
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
        // Commit transaction
        // --------------------------------------------------
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            data: {
                transaction_id: cardTransaction.transaction_id,
                authorization_status: "EXPIRED",
                transaction_status: "FAILED",
                released_amount: transactionAmount.toFixed(2),
                holding_amount: newHoldingAmount.toFixed(2),
            },
        };

    } catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ExpireCardTransactionAuthorization",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`ExpireCardTransactionAuthorization facing issue`, sanitizedError);

    } finally {

        await mongoSession.endSession();

    }
};

export default expireCardAuthorizationTransaction;