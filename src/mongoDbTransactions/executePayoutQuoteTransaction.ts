import mongoose, { Types } from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { fiatPayoutTransactionsModel as fiat_payout_transactions } from "../models/fiat_payout_transactions.js";
import { fiatPayoutQuoteModel as fiat_payout_quotes } from "../models/fiat_payout_quotes.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, } from "../utils/AppErrorClass.js";
import type { fiatPayoutQuoteSchemaTypes, walletDetailsType } from "../types/schemaTypes.js";
import { Decimal } from "decimal.js";
import crypto from "crypto";
import sanitizeApiError from "../utils/sanitizeApiError.js";

type ExecuteFiatPayoutTransactionData = {
    payoutQuoteId: Types.ObjectId;
    userId: Types.ObjectId;
};

const executeFiatPayoutTransaction = async (
    transactionData: ExecuteFiatPayoutTransactionData
) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        const {
            payoutQuoteId,
            userId,
        } = transactionData;

        const now = new Date();

        // --------------------------------------------------
        // Get latest payout quote inside transaction
        // --------------------------------------------------

        const payoutQuote = await fiat_payout_quotes.findOne(
            {
                _id: payoutQuoteId,
                user_id: userId,
            }
        ).session(mongoSession);

        if (!payoutQuote) {
            throw new ServiceError("Payout quote not found");
        }

        // --------------------------------------------------
        // Validate quote status
        // --------------------------------------------------

        if (payoutQuote.quote_status !== "ACTIVE") {
            throw new ServiceError(
                `Payout quote cannot be executed because its status is ${payoutQuote.quote_status}`
            );
        }

        // --------------------------------------------------
        // Validate quote expiry
        // --------------------------------------------------

        if (payoutQuote.expires_at.getTime() <= now.getTime()) {

            await fiat_payout_quotes.updateOne(
                {
                    _id: payoutQuote._id,
                    user_id: userId,
                    quote_status: "ACTIVE",
                },
                {
                    $set: {
                        quote_status: "EXPIRED",
                    },
                },
                {
                    session: mongoSession,
                }
            );

            throw new ServiceError("Payout quote has expired");
        }

        // --------------------------------------------------
        // Prepare payout amount
        // --------------------------------------------------

        const payoutSourceAmount = new Decimal(
            payoutQuote.source_amount?.toString() ?? "0"
        );

        if (payoutSourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid payout source amount");
        }

        // --------------------------------------------------
        // Get latest wallet details inside transaction
        // --------------------------------------------------

        const userWalletDetails = await user_wallet_details.findOne(
            {
                user_id: userId,
            }
        ).session(mongoSession);

        if (!userWalletDetails) {
            throw new ServiceError("User wallet details not found");
        }

        // --------------------------------------------------
        // Find source wallet
        // --------------------------------------------------

        const sourceWalletIndex =
            userWalletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency === payoutQuote.source_currency &&
                    wallet.wallet_status === "ACTIVE"
            );

        if (sourceWalletIndex === -1) {
            throw new ServiceError(
                `Active ${payoutQuote.source_currency} fiat wallet not found`
            );
        }

        const sourceWallet =
            userWalletDetails.wallets_details[sourceWalletIndex];

        if (!sourceWallet) {
            throw new ServiceError(
                `Source wallet details not found for ${payoutQuote.source_currency}`
            );
        }

        // --------------------------------------------------
        // Read wallet balances
        // --------------------------------------------------

        const currentAccountBalance = new Decimal(
            sourceWallet.account_balance?.toString() ?? "0"
        );

        const currentAvailableBalance = new Decimal(
            sourceWallet.available_balance?.toString() ?? "0"
        );

        const currentHoldingAmount = new Decimal(
            sourceWallet.holding_amount?.toString() ?? "0"
        );

        // --------------------------------------------------
        // Validate wallet accounting invariant
        //
        // account_balance =
        // available_balance + holding_amount
        // --------------------------------------------------

        const calculatedAvailableBalance =
            currentAccountBalance.minus(currentHoldingAmount);

        if (!calculatedAvailableBalance.eq(currentAvailableBalance)) {
            throw new ServiceError(
                "Wallet balance inconsistency detected"
            );
        }

        // --------------------------------------------------
        // Check available balance
        // --------------------------------------------------

        if (currentAvailableBalance.lessThan(payoutSourceAmount)) {
            throw new ServiceError("Insufficient wallet balance");
        }

        // --------------------------------------------------
        // Calculate new balances
        //
        // available → holding
        // account remains unchanged
        // --------------------------------------------------

        const newAvailableBalance =
            currentAvailableBalance.minus(payoutSourceAmount);

        const newHoldingAmount =
            currentHoldingAmount.plus(payoutSourceAmount);

        // --------------------------------------------------
        // Atomically reserve wallet amount
        // --------------------------------------------------

        const walletUpdateResult = await user_wallet_details.updateOne(
            {
                _id: userWalletDetails._id,

                wallets_details: {
                    $elemMatch: {
                        wallet_type: "FIAT",
                        wallet_currency: payoutQuote.source_currency,
                        wallet_status: "ACTIVE",

                        account_balance:
                            sourceWallet.account_balance,

                        available_balance:
                            sourceWallet.available_balance,

                        holding_amount:
                            sourceWallet.holding_amount,
                    },
                },
            },
            {
                $set: {
                    [`wallets_details.${sourceWalletIndex}.available_balance`]:
                        mongoose.Types.Decimal128.fromString(
                            newAvailableBalance.toFixed(4)
                        ),

                    [`wallets_details.${sourceWalletIndex}.holding_amount`]:
                        mongoose.Types.Decimal128.fromString(
                            newHoldingAmount.toFixed(4)
                        ),
                },
            },
            {
                session: mongoSession,
            }
        );

        if (walletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError(
                "Wallet balance changed before payout execution. Please create a new payout quote."
            );
        }

        // --------------------------------------------------
        // Create fiat payout transaction
        // --------------------------------------------------

        const [payoutTransaction] =
            await fiat_payout_transactions.create(
                [
                    {
                        quote_id: payoutQuote._id,
                        user_id: payoutQuote.user_id,
                        wallet_id: payoutQuote.wallet_id,
                        beneficiary_id: payoutQuote.beneficiary_id,

                        source_currency:
                            payoutQuote.source_currency,

                        source_amount:
                            payoutQuote.source_amount,

                        destination_currency:
                            payoutQuote.destination_currency,

                        destination_amount:
                            payoutQuote.destination_amount,

                        exchange_rate:
                            payoutQuote.exchange_rate,

                        fee_amount:
                            payoutQuote.fee_amount,

                        status: "PENDING",

                        provider_reference: null,

                        remarks:
                            "Payout initiated and awaiting processing",
                    },
                ],
                {
                    session: mongoSession,
                    ordered: true,
                }
            );

        if (!payoutTransaction) {
            throw new ServiceError(
                "Failed to create payout transaction"
            );
        }

        // --------------------------------------------------
        // Create wallet HOLD transaction
        // --------------------------------------------------

        const walletTransactionId = new Types.ObjectId();

        const walletTransaction = {
            cardholder_id:
                userWalletDetails.cardholder_id,

            wallet_id:
                payoutQuote.wallet_id,

            transaction_id:
                walletTransactionId,

            transaction_type:
                "HOLD" as const,

            transaction_status:
                "PENDING" as const,

            wallet_details: {
                wallet_type:
                    "FIAT" as const,

                wallet_currency:
                    payoutQuote.source_currency,
            },

            amount:
                mongoose.Types.Decimal128.fromString(
                    payoutSourceAmount.toFixed(4)
                ),

            // Fee belongs to the wallet transaction only
            // when the wallet itself is charged a fee.
            fee:
                mongoose.Types.Decimal128.fromString("0"),

            balance_before:
                mongoose.Types.Decimal128.fromString(
                    currentAvailableBalance.toFixed(4)
                ),

            balance_after:
                mongoose.Types.Decimal128.fromString(
                    newAvailableBalance.toFixed(4)
                ),

            reference_id:
                payoutTransaction._id.toString(),

            remarks:
                "Amount held for fiat payout",
        };

        await user_wallet_transactions.create(
            [walletTransaction],
            {
                session: mongoSession,
                ordered: true,
            }
        );

        // --------------------------------------------------
        // Mark quote as executed
        // --------------------------------------------------

        const quoteUpdateResult =
            await fiat_payout_quotes.updateOne(
                {
                    _id: payoutQuote._id,
                    user_id: userId,
                    quote_status: "ACTIVE",
                    expires_at: {
                        $gt: now,
                    },
                },
                {
                    $set: {
                        quote_status: "EXECUTED",
                    },
                },
                {
                    session: mongoSession,
                }
            );

        if (quoteUpdateResult.modifiedCount !== 1) {
            throw new ServiceError(
                "Payout quote could not be marked as executed"
            );
        }

        // --------------------------------------------------
        // Commit transaction
        // --------------------------------------------------

        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",

            data: {
                payout_transaction_id:
                    payoutTransaction._id.toString(),

                wallet_transaction_id:
                    walletTransactionId.toString(),

                wallet_id:
                    payoutQuote.wallet_id.toString(),

                source_currency:
                    payoutQuote.source_currency,

                source_amount:
                    payoutQuote.source_amount,

                destination_currency:
                    payoutQuote.destination_currency,

                destination_amount:
                    payoutQuote.destination_amount,

                status: "PENDING",
            },
        };

    } catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName:
                    "ExecuteFiatPayoutTransaction",
            }
        );

        const sanitizedError =
            sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            "ExecuteFiatPayoutTransaction facing issue",
            sanitizedError
        );

    } finally {

        await mongoSession.endSession();

    }
};

export default executeFiatPayoutTransaction;