import mongoose from "mongoose";
import {
    userCardTransactionsModel as user_card_transactions,
} from "../models/user_card_transaction_details.js";
import {
    userWalletDetailsModel as user_wallet_details,
} from "../models/user_wallet_details.js";
import {
    userWalletTransactionsModel as user_wallet_transactions,
} from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import {
    AppErrorClass,
    ServiceError,
    NotFoundError,
} from "../utils/AppErrorClass.js";
import { Decimal } from "decimal.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import type { Types } from "mongoose";


// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ExpireCardTransactionAuthorizationData = {
    transactionId: Types.ObjectId;
};


// -----------------------------------------------------------------------------
// Expire Card Transaction Authorization
// -----------------------------------------------------------------------------

const expireCardAuthorizationTransaction = async (
    transactionData: ExpireCardTransactionAuthorizationData
) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        const {
            transactionId,
        } = transactionData;

        const now = new Date();


        // ---------------------------------------------------------------------
        // Validate transaction ID
        // ---------------------------------------------------------------------

        if (!transactionId) {
            throw new ServiceError(
                "Transaction ID is required"
            );
        }


        // ---------------------------------------------------------------------
        // Get card transaction
        //
        // IMPORTANT:
        // Re-check everything inside the MongoDB transaction.
        //
        // The cron job only discovers expired transactions.
        // This query is the authoritative check.
        // ---------------------------------------------------------------------

        const cardTransaction =
            await user_card_transactions.findOne(
                {
                    transaction_id:
                        transactionId,

                    authorization_type:
                        "HOLD",

                    authorization_status:
                        "PENDING",

                    transaction_status:
                        "PENDING",

                    authorization_expires_at: {
                        $lte: now,
                    },
                },
                null,
                {
                    session:
                        mongoSession,
                }
            );


        // ---------------------------------------------------------------------
        // Transaction was already processed
        //
        // This can happen when:
        //
        // 1. Authorization webhook approved it before cron processed it.
        // 2. Authorization webhook rejected it before cron processed it.
        // 3. Another cron instance already expired it.
        //
        // This is NOT a wallet error.
        // ---------------------------------------------------------------------

        if (!cardTransaction) {

            await mongoSession.abortTransaction();

            return {
                status: "SUCCESS",

                data: {
                    transaction_id:
                        transactionId,

                    message:
                        "Card transaction is no longer pending or has not expired",
                },
            };
        }


        // ---------------------------------------------------------------------
        // Prepare transaction amount
        // ---------------------------------------------------------------------

        const transactionAmount =
            new Decimal(
                cardTransaction.amount?.toString() ?? "0"
            );


        if (
            !transactionAmount.isFinite() ||
            transactionAmount.isNaN() ||
            transactionAmount.lessThanOrEqualTo(0)
        ) {
            throw new ServiceError(
                "Invalid card transaction amount"
            );
        }


        // ---------------------------------------------------------------------
        // Convert amount to Decimal128
        // ---------------------------------------------------------------------

        const amountDecimal128 =
            mongoose.Types.Decimal128.fromString(
                transactionAmount
                    .toDecimalPlaces(4)
                    .toString()
            );


        const negativeAmountDecimal128 =
            mongoose.Types.Decimal128.fromString(
                transactionAmount
                    .negated()
                    .toDecimalPlaces(4)
                    .toString()
            );


        // ---------------------------------------------------------------------
        // Find wallet
        // ---------------------------------------------------------------------

        const walletDetails =
            await user_wallet_details.findOne(
                {
                    cardholder_id:
                        cardTransaction.cardholder_id,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type:
                                "FIAT",

                            wallet_currency:
                                cardTransaction.currency,

                            wallet_status:
                                "ACTIVE",
                        },
                    },
                },
                null,
                {
                    session:
                        mongoSession,
                }
            );


        if (!walletDetails) {
            throw new NotFoundError(
                "Active user wallet not found"
            );
        }


        // ---------------------------------------------------------------------
        // Find exact wallet index
        // ---------------------------------------------------------------------

        const walletIndex =
            walletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type ===
                    "FIAT" &&

                    wallet.wallet_currency ===
                    cardTransaction.currency &&

                    wallet.wallet_status ===
                    "ACTIVE"
            );


        if (walletIndex === -1) {
            throw new NotFoundError(
                `Active ${cardTransaction.currency} wallet not found`
            );
        }


        const wallet =
            walletDetails.wallets_details[
            walletIndex
            ];


        if (!wallet) {
            throw new NotFoundError(
                `Active ${cardTransaction.currency} wallet not found`
            );
        }


        // ---------------------------------------------------------------------
        // Convert current wallet balances to Decimal.js
        // ---------------------------------------------------------------------

        const currentAccountBalance =
            new Decimal(
                wallet.account_balance?.toString() ?? "0"
            );


        const currentAvailableBalance =
            new Decimal(
                wallet.available_balance?.toString() ?? "0"
            );


        const currentHoldingAmount =
            new Decimal(
                wallet.holding_amount?.toString() ?? "0"
            );


        // ---------------------------------------------------------------------
        // Validate wallet balances
        // ---------------------------------------------------------------------

        if (
            !currentAccountBalance.isFinite() ||
            !currentAvailableBalance.isFinite() ||
            !currentHoldingAmount.isFinite()
        ) {
            throw new ServiceError(
                "Invalid wallet balance values"
            );
        }


        if (
            currentAccountBalance.isNegative() ||
            currentAvailableBalance.isNegative() ||
            currentHoldingAmount.isNegative()
        ) {
            throw new ServiceError(
                "Wallet balance cannot be negative"
            );
        }


        // ---------------------------------------------------------------------
        // Validate wallet accounting invariant
        //
        // account_balance =
        // available_balance + holding_amount
        // ---------------------------------------------------------------------

        if (
            !currentAccountBalance.equals(
                currentAvailableBalance.plus(
                    currentHoldingAmount
                )
            )
        ) {
            throw new ServiceError(
                "Wallet balance inconsistency detected before releasing card transaction hold"
            );
        }


        // ---------------------------------------------------------------------
        // Validate holding amount
        // ---------------------------------------------------------------------

        if (
            transactionAmount.greaterThan(
                currentHoldingAmount
            )
        ) {
            throw new ServiceError(
                "Insufficient holding amount to release card transaction hold"
            );
        }


        // ---------------------------------------------------------------------
        // Calculate new wallet balances
        //
        // Expiry releases the HOLD:
        //
        // holding_amount -= transaction amount
        // available_balance += transaction amount
        // account_balance remains unchanged
        // ---------------------------------------------------------------------

        const newHoldingAmount =
            currentHoldingAmount.minus(
                transactionAmount
            );


        const newAvailableBalance =
            currentAvailableBalance.plus(
                transactionAmount
            );


        const newAccountBalance =
            currentAccountBalance;


        // ---------------------------------------------------------------------
        // Validate resulting wallet invariant
        // ---------------------------------------------------------------------

        if (
            !newAccountBalance.equals(
                newAvailableBalance.plus(
                    newHoldingAmount
                )
            )
        ) {
            throw new ServiceError(
                "Wallet balance inconsistency detected after releasing card transaction hold"
            );
        }


        // ---------------------------------------------------------------------
        // Update wallet
        //
        // IMPORTANT:
        // The filter checks the current holding amount.
        //
        // This prevents releasing the same HOLD twice if another process
        // changes the wallet before this update.
        // ---------------------------------------------------------------------

        const walletUpdateResult =
            await user_wallet_details.updateOne(
                {
                    _id:
                        walletDetails._id,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type:
                                "FIAT",

                            wallet_currency:
                                cardTransaction.currency,

                            wallet_status:
                                "ACTIVE",

                            holding_amount:
                                wallet.holding_amount,
                        },
                    },
                },
                {
                    $inc: {
                        "wallets_details.$.holding_amount":
                            negativeAmountDecimal128,

                        "wallets_details.$.available_balance":
                            amountDecimal128,
                    },
                },
                {
                    session:
                        mongoSession,
                }
            );


        if (
            walletUpdateResult.modifiedCount !== 1
        ) {
            throw new ServiceError(
                "Wallet holding amount changed before card authorization expired"
            );
        }


        // ---------------------------------------------------------------------
        // Find wallet HOLD transaction
        //
        // Use transaction_id because the card transaction and wallet HOLD
        // transaction are created for the same transaction.
        // ---------------------------------------------------------------------

        const walletTransaction =
            await user_wallet_transactions.findOne(
                {
                    transaction_id:
                        cardTransaction.transaction_id,

                    transaction_type:
                        "HOLD",

                    transaction_status:
                        "PENDING",
                },
                null,
                {
                    session:
                        mongoSession,
                }
            );


        if (!walletTransaction) {
            throw new NotFoundError(
                "Pending wallet HOLD transaction not found"
            );
        }


        // ---------------------------------------------------------------------
        // Update wallet HOLD transaction
        //
        // balance_before remains the balance before the original HOLD.
        // balance_after should represent the balance after releasing the HOLD.
        //
        // Since account_balance does not change during HOLD release,
        // balance_after is the current account balance.
        // ---------------------------------------------------------------------

        const walletTransactionUpdateResult =
            await user_wallet_transactions.updateOne(
                {
                    _id:
                        walletTransaction._id,

                    transaction_type:
                        "HOLD",

                    transaction_status:
                        "PENDING",
                },
                {
                    $set: {
                        transaction_status:
                            "FAILED",

                        balance_after:
                            mongoose.Types.Decimal128.fromString(
                                newAccountBalance
                                    .toDecimalPlaces(4)
                                    .toString()
                            ),

                        remarks:
                            "Card transaction authorization expired and wallet hold was released",
                    },
                },
                {
                    session:
                        mongoSession,
                }
            );


        if (
            walletTransactionUpdateResult.modifiedCount !== 1
        ) {
            throw new ServiceError(
                "Failed to update wallet HOLD transaction"
            );
        }


        // ---------------------------------------------------------------------
        // Update card transaction
        //
        // PENDING
        //    ↓
        // EXPIRED
        //
        // Transaction:
        // PENDING
        //    ↓
        // FAILED
        //
        // No card limit is consumed.
        // ---------------------------------------------------------------------

        const cardTransactionUpdateResult =
            await user_card_transactions.updateOne(
                {
                    _id:
                        cardTransaction._id,

                    authorization_status:
                        "PENDING",

                    transaction_status:
                        "PENDING",

                    authorization_expires_at: {
                        $lte:
                            now,
                    },
                },
                {
                    $set: {
                        authorization_status:
                            "EXPIRED",

                        transaction_status:
                            "FAILED",

                        authorized_at:
                            null,

                        authorized_by:
                            null,

                        remarks:
                            "Card transaction authorization expired and wallet hold was released",
                    },
                },
                {
                    session:
                        mongoSession,
                }
            );


        if (
            cardTransactionUpdateResult.modifiedCount !== 1
        ) {
            throw new ServiceError(
                "Card transaction was already processed"
            );
        }


        // ---------------------------------------------------------------------
        // Commit transaction
        // ---------------------------------------------------------------------

        await mongoSession.commitTransaction();


        // ---------------------------------------------------------------------
        // Return successful expiry response
        // ---------------------------------------------------------------------

        return {
            status: "SUCCESS",

            data: {
                transaction_id:
                    cardTransaction.transaction_id,

                authorization_status:
                    "EXPIRED",

                transaction_status:
                    "FAILED",

                released_amount:
                    transactionAmount
                        .toDecimalPlaces(4)
                        .toString(),

                holding_amount:
                    newHoldingAmount
                        .toDecimalPlaces(4)
                        .toString(),

                available_balance:
                    newAvailableBalance
                        .toDecimalPlaces(4)
                        .toString(),

                account_balance:
                    newAccountBalance
                        .toDecimalPlaces(4)
                        .toString(),
            },
        };


    } catch (err: any) {

        // ---------------------------------------------------------------------
        // Abort transaction only when transaction is active
        // ---------------------------------------------------------------------

        if (
            mongoSession.inTransaction()
        ) {
            try {

                await mongoSession.abortTransaction();

            } catch (abortError) {

                logger.error(
                    err,
                    {
                        serviceName:
                            "ExpireCardTransactionAuthorization",

                        transactionId:
                            transactionData.transactionId,

                        message:
                            "Failed to abort card authorization expiry transaction",
                    }
                );
            }
        }


        // ---------------------------------------------------------------------
        // Log error
        // ---------------------------------------------------------------------

        const error =
            err as any;


        logger.error(
            error,
            {
                serviceName:
                    "ExpireCardTransactionAuthorization",

                transactionId:
                    transactionData.transactionId,
            }
        );


        // ---------------------------------------------------------------------
        // Sanitize error
        // ---------------------------------------------------------------------

        const sanitizedError =
            sanitizeApiError(error);


        if (
            error instanceof AppErrorClass
        ) {
            throw error;
        }


        throw new ServiceError(
            "ExpireCardTransactionAuthorization facing issue",
            sanitizedError
        );


    } finally {

        // ---------------------------------------------------------------------
        // End MongoDB session
        // ---------------------------------------------------------------------

        await mongoSession.endSession();
    }
};


export default expireCardAuthorizationTransaction;