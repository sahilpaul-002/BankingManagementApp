import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, NotFoundError } from "../utils/AppErrorClass.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";

const cardTransactionSettlementTransaction = async (
    decoded: {
        userId: string;
        action: "APPROVE" | "REJECT";
        transactionId: string;
    },
    transaction: any
) => {
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

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

        // Get Wallet
        const wallet = await user_wallet_details.findOne(
            {
                wallet_id: walletTransaction.wallet_id,
                wallets_details: {
                    $elemMatch: {
                        wallet_type:
                            walletTransaction.wallet_details.wallet_type,
                        wallet_currency:
                            walletTransaction.wallet_details.wallet_currency,
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

        const walletData = wallet.wallets_details.find(
            (x) =>
                x.wallet_type === walletTransaction.wallet_details.wallet_type && x.wallet_currency === walletTransaction.wallet_details.wallet_currency
        );

        if (!walletData) {
            throw new NotFoundError("Wallet details not found");
        }

        const amount = Number(walletTransaction.amount);

        const updateInc: Record<string, number> = {};
        const updateSet: Record<string, any> = {};

        // Approve Card Transaction Settlement
        if (decoded.action === "APPROVE") {
            updateInc["wallets_details.$.holding_amount"] = -amount;
            updateInc["wallets_details.$.account_balance"] = -amount;
            updateSet["authorization_status"] = "AUTHORIZED";
            updateSet["transaction_status"] = "SUCCESS";
            updateSet["authorized_at"] = new Date();
            updateSet["authorized_by"] = decoded.userId;
            await user_wallet_transactions.updateOne(
                {
                    transaction_id: transaction.transaction_id,
                },
                {
                    $set: {
                        transaction_status: "SUCCESS",
                    },
                },
                {
                    session: mongoSession,
                }
            );
        }

        // Reject Card Transaction Settlement
        else {
            updateInc["wallets_details.$.holding_amount"] = -amount;
            updateSet["authorization_status"] = "REJECTED";
            updateSet["transaction_status"] = "FAILED";
            updateSet["authorized_at"] = new Date();
            updateSet["authorized_by"] = decoded.userId;
            await user_wallet_transactions.updateOne(
                {
                    transaction_id: transaction.transaction_id,
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
        }

        // Update Wallet
        const walletUpdate = await user_wallet_details.updateOne(
            {
                wallet_id: wallet.wallet_id,
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

        if (!walletUpdate.modifiedCount) {
            throw new ServiceError("Failed to update wallet");
        }

        // Update Card Transaction
        const cardUpdate = await user_card_transactions.updateOne(
            {
                transaction_id: transaction.transaction_id,
            },
            {
                $set: updateSet,
            },
            {
                session: mongoSession,
            }
        );

        if (!cardUpdate.modifiedCount) {
            throw new ServiceError(
                "Failed to update card transaction"
            );
        }

        // -----------------------------------------------------

        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            data: {
                transactionId: transaction.transaction_id,
                action: decoded.action,
            },
        };
    } catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, {serviceName: "CardTransactionSettlementTransaction"});

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CardTransactionSettlementTransaction failed: ${error.message}`);
    } 
    finally {
        await mongoSession.endSession();
    }
};

export default cardTransactionSettlementTransaction;