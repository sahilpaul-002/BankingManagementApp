import mongoose from "mongoose";
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
    payoutQuote: fiatPayoutQuoteSchemaTypes;
    sourceWallet: walletDetailsType;
    cardholderId: string;
};


// ------------------------------------- EXECUTE FIAT PAYOUT MONGODB TRANSACTION -------------------------------------

const executeFiatPayoutTransaction = async (transactionData: ExecuteFiatPayoutTransactionData) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        const {payoutQuote, sourceWallet, cardholderId} = transactionData;


        // --------------------------------------------------
        // Prepare amounts
        // --------------------------------------------------
        const payoutSourceAmount = new Decimal(
            payoutQuote.source_amount?.toString() ?? "0"
        );

        if (payoutSourceAmount.lessThanOrEqualTo(0)) {
            throw new ServiceError(
                "Invalid payout source amount"
            );
        }


        // --------------------------------------------------
        // Atomically consume the quote
        // --------------------------------------------------
        // The service has already checked the quote.
        //
        // This additional ACTIVE condition is NOT duplicate
        // validation. It protects against two requests trying
        // to execute the same quote simultaneously.
        // --------------------------------------------------

        const quoteUpdateResult = await fiat_payout_quotes.updateOne(
            {
                _id: payoutQuote._id,
                user_id: payoutQuote.user_id,
                quote_status: "ACTIVE",
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
            throw new ServiceError("Payout quote has already been used or is no longer active");
        }


        // --------------------------------------------------
        // Calculate wallet balances
        // --------------------------------------------------
        const currentAccountBalance = new Decimal(sourceWallet.account_balance?.toString() ?? "0");
        const currentHoldingAmount = new Decimal(sourceWallet.holding_amount?.toString() ?? "0");
        const currentAvailableBalance = currentAccountBalance.minus(currentHoldingAmount);
        const newHoldingAmount = currentHoldingAmount.plus(payoutSourceAmount);

        // --------------------------------------------------
        // Move amount:
        //
        // available balance
        //      ↓
        // holding amount
        //
        // account_balance stays unchanged.
        // --------------------------------------------------

        const walletUpdateResult = await user_wallet_details.updateOne(
            {
                user_id: payoutQuote.user_id,
                wallet_id: payoutQuote.wallet_id,
                wallets_details: {
                    $elemMatch: {
                        wallet_type: "FIAT",
                        wallet_currency: payoutQuote.source_currency,
                        wallet_status: "ACTIVE",

                        // Important concurrency protection.
                        //
                        // Do not update the wallet if the
                        // balance changed after the service
                        // performed its initial check.
                        account_balance: sourceWallet.account_balance,
                        holding_amount: sourceWallet.holding_amount,
                    },
                },
            },
            {
                $set: {
                    "wallets_details.$.holding_amount":
                        newHoldingAmount.toFixed(4),
                },
            },
            {
                session: mongoSession,
            }
        );


        if (walletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("Wallet balance changed before payout execution. Please create a new payout quote.");
        }

        // --------------------------------------------------
        // Create fiat payout transaction
        // --------------------------------------------------
        const payoutTransactionId = crypto.randomUUID();

        await fiat_payout_transactions.create(
            [
                {
                    quote_id: payoutQuote._id?.toString(),
                    user_id: payoutQuote.user_id,
                    wallet_id: payoutQuote.wallet_id,
                    beneficiary_id: payoutQuote.beneficiary_id,
                    source_currency: payoutQuote.source_currency,
                    source_amount: payoutQuote.source_amount,
                    destination_currency: payoutQuote.destination_currency,
                    destination_amount: payoutQuote.destination_amount,
                    exchange_rate: payoutQuote.exchange_rate,
                    fee_amount: payoutQuote.fee_amount,
                    status: "PENDING",
                    provider_reference: null,
                    remarks: "Payout initiated and awaiting processing",
                },
            ],
            {
                session: mongoSession,
            }
        );


        // --------------------------------------------------
        // Create wallet transaction
        // --------------------------------------------------

        const walletTransactionId = crypto.randomUUID();

        const walletBalanceBefore = currentAvailableBalance;

        const walletBalanceAfter = currentAvailableBalance.minus(payoutSourceAmount);


        const walletTransaction = {
            cardholder_id: cardholderId,
            wallet_id: payoutQuote.wallet_id,
            transaction_id: walletTransactionId,
            transaction_type: "HOLD" as const,
            transaction_status: "PENDING" as const,
            wallet_details: {
                wallet_type: "FIAT" as const,
                wallet_currency: payoutQuote.source_currency,
            },
            amount: payoutQuote.source_amount,
            balance_before: walletBalanceBefore.toFixed(4),
            balance_after: walletBalanceAfter.toFixed(4),
            reference_id: payoutTransactionId,
            remarks: "Amount held for fiat payout",
        };

        await user_wallet_transactions.create(
            [walletTransaction],
            {
                session: mongoSession,
            }
        );


        // --------------------------------------------------
        // Commit transaction
        // --------------------------------------------------

        await mongoSession.commitTransaction();


        return {
            status: "SUCCESS",

            data: {
                payout_transaction_id: payoutTransactionId,
                wallet_transaction_id: walletTransactionId,
                wallet_id: payoutQuote.wallet_id,
                source_currency: payoutQuote.source_currency,
                source_amount: payoutQuote.source_amount,
                destination_currency: payoutQuote.destination_currency,
                destination_amount: payoutQuote.destination_amount,
                status: "PENDING",
            },
        };

    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ExecuteFiatPayoutTransaction",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`ExecuteFiatPayoutTransaction facing issue`, sanitizedError);
    }
    finally {

        await mongoSession.endSession();

    }
};


export default executeFiatPayoutTransaction;