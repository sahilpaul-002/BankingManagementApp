import mongoose from "mongoose";
import { Decimal } from "decimal.js";
import {userWalletDetailsModel as user_wallet_details,} from "../models/user_wallet_details.js";
import {userWalletTransactionsModel as user_wallet_transactions,} from "../models/user_wallet_transaction_details.js";
import {walletCurrencyConversionQuoteModel as wallet_currency_conversion_quote,} from "../models/wallet_currency_conversion_quote.js";
import logger from "../utils/logger.js";
import {AppErrorClass, BadRequestError, ServiceError} from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";

interface ExecuteWalletCurrencyConversionTransactionParams {
    conversionQuote: any;
    sourceWallet: walletDetailsType;
    destinationWallet: walletDetailsType;
    cardholderId: string;
}


const executeWalletCurrencyConversionTransaction = async ({
    conversionQuote,
    sourceWallet,
    destinationWallet,
    cardholderId,
}: ExecuteWalletCurrencyConversionTransactionParams) => {

    const mongoSession = await mongoose.startSession();

    try {

        // --------------------------------------------------
        // Start MongoDB transaction
        // --------------------------------------------------

        mongoSession.startTransaction();


        // --------------------------------------------------
        // Extract quote details
        // --------------------------------------------------

        const sourceCurrency =
            conversionQuote.source_currency;

        const destinationCurrency =
            conversionQuote.destination_currency;


        // --------------------------------------------------
        // Convert quote amounts to Decimal.js
        // --------------------------------------------------

        const sourceAmount =
            new Decimal(
                conversionQuote.source_amount?.toString() ?? "0"
            );

        const destinationAmount =
            new Decimal(
                conversionQuote.destination_amount?.toString() ?? "0"
            );

        const feeAmount =
            new Decimal(
                conversionQuote.fee_amount?.toString() ?? "0"
            );

        const exchangeRate =
            new Decimal(
                conversionQuote.exchange_rate?.toString() ?? "0"
            );


        // --------------------------------------------------
        // Validate quote amounts
        // --------------------------------------------------

        if (sourceAmount.lessThanOrEqualTo(0)) {
            throw new BadRequestError(
                "Invalid source conversion amount"
            );
        }

        if (destinationAmount.lessThanOrEqualTo(0)) {
            throw new BadRequestError(
                "Invalid destination conversion amount"
            );
        }

        if (exchangeRate.lessThanOrEqualTo(0)) {
            throw new BadRequestError(
                "Invalid conversion exchange rate"
            );
        }

        if (feeAmount.isNegative()) {
            throw new BadRequestError(
                "Invalid conversion fee"
            );
        }


        // --------------------------------------------------
        // Validate source wallet
        // --------------------------------------------------

        if (
            sourceWallet.wallet_currency !==
            sourceCurrency
        ) {
            throw new ServiceError(
                "Source wallet does not match conversion quote"
            );
        }

        if (
            sourceWallet.wallet_status !==
            "ACTIVE"
        ) {
            throw new ServiceError(
                `Source ${sourceCurrency} wallet is not active`
            );
        }


        // --------------------------------------------------
        // Validate destination wallet
        // --------------------------------------------------

        if (
            destinationWallet.wallet_currency !==
            destinationCurrency
        ) {
            throw new ServiceError(
                "Destination wallet does not match conversion quote"
            );
        }

        if (
            destinationWallet.wallet_status !==
            "ACTIVE"
        ) {
            throw new ServiceError(
                `Destination ${destinationCurrency} wallet is not active`
            );
        }


        // --------------------------------------------------
        // Fetch latest wallet document
        //
        // We do this inside the transaction so execution
        // does not depend only on the wallet snapshot
        // obtained by the execute service.
        // --------------------------------------------------

        const walletDetails =
            await user_wallet_details
                .findOne({
                    cardholder_id: cardholderId,
                    wallet_id: conversionQuote.wallet_id,
                })
                .session(mongoSession);


        if (!walletDetails) {
            throw new ServiceError(
                "User wallet details not found"
            );
        }


        // --------------------------------------------------
        // Find latest source wallet
        // --------------------------------------------------

        const sourceWalletIndex =
            walletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency ===
                    sourceCurrency &&
                    wallet.wallet_status === "ACTIVE"
            );


        if (sourceWalletIndex === -1) {
            throw new ServiceError(
                `Active ${sourceCurrency} source wallet not found`
            );
        }


        // --------------------------------------------------
        // Find latest destination wallet
        // --------------------------------------------------

        const destinationWalletIndex =
            walletDetails.wallets_details.findIndex(
                (wallet) =>
                    wallet.wallet_type === "FIAT" &&
                    wallet.wallet_currency ===
                    destinationCurrency &&
                    wallet.wallet_status === "ACTIVE"
            );


        if (destinationWalletIndex === -1) {
            throw new ServiceError(
                `Active ${destinationCurrency} destination wallet not found`
            );
        }


        // --------------------------------------------------
        // Prevent accidental same wallet conversion
        // --------------------------------------------------

        if (
            sourceWalletIndex ===
            destinationWalletIndex
        ) {
            throw new BadRequestError(
                "Source and destination wallets cannot be the same"
            );
        }


        // --------------------------------------------------
        // Get latest wallet objects
        // --------------------------------------------------

        const latestSourceWallet =
            walletDetails.wallets_details[
            sourceWalletIndex
            ];

        const latestDestinationWallet =
            walletDetails.wallets_details[
            destinationWalletIndex
            ];


        if (!latestSourceWallet) {
            throw new ServiceError(
                "Latest source wallet not found"
            );
        }

        if (!latestDestinationWallet) {
            throw new ServiceError(
                "Latest destination wallet not found"
            );
        }


        // --------------------------------------------------
        // Get current source balance
        // --------------------------------------------------

        const sourceBalance =
            new Decimal(
                latestSourceWallet.account_balance
                    ?.toString() ?? "0"
            );


        const sourceHoldingAmount =
            new Decimal(
                latestSourceWallet.holding_amount
                    ?.toString() ?? "0"
            );


        const availableSourceBalance =
            sourceBalance.minus(
                sourceHoldingAmount
            );


        // --------------------------------------------------
        // IMPORTANT:
        // Re-check balance inside transaction
        // --------------------------------------------------

        if (
            availableSourceBalance.lessThan(
                sourceAmount
            )
        ) {
            throw new BadRequestError(
                `Insufficient available ${sourceCurrency} wallet balance`
            );
        }


        // --------------------------------------------------
        // Get destination balance
        // --------------------------------------------------

        const destinationBalance =
            new Decimal(
                latestDestinationWallet.account_balance
                    ?.toString() ?? "0"
            );


        // --------------------------------------------------
        // Calculate new balances
        // --------------------------------------------------

        const newSourceBalance =
            sourceBalance
                .minus(sourceAmount)
                .toDecimalPlaces(2);


        const newDestinationBalance =
            destinationBalance
                .plus(destinationAmount)
                .toDecimalPlaces(2);


        // --------------------------------------------------
        // Create common conversion reference
        //
        // Both wallet transactions belong to the same
        // currency conversion operation.
        // --------------------------------------------------

        const conversionReferenceId =
            crypto.randomUUID();


        // --------------------------------------------------
        // Source wallet atomic update
        //
        // The old balance is included in the query.
        //
        // Therefore another transaction cannot overwrite
        // a newer balance.
        // --------------------------------------------------

        const sourceWalletUpdateResult =
            await user_wallet_details.updateOne(
                {
                    _id: walletDetails._id,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type: "FIAT",

                            wallet_currency:
                                sourceCurrency,

                            wallet_status: "ACTIVE",

                            account_balance:
                                latestSourceWallet.account_balance,
                        },
                    },
                },
                {
                    $set: {
                        [`wallets_details.${sourceWalletIndex}.account_balance`]:
                            mongoose.Types.Decimal128.fromString(
                                newSourceBalance.toFixed(2)
                            ),
                    },
                },
                {
                    session: mongoSession,
                }
            );


        if (
            sourceWalletUpdateResult.modifiedCount !==
            1
        ) {
            throw new ServiceError(
                "Source wallet balance changed before currency conversion"
            );
        }


        // --------------------------------------------------
        // Destination wallet update
        // --------------------------------------------------

        const destinationWalletUpdateResult =
            await user_wallet_details.updateOne(
                {
                    _id: walletDetails._id,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type: "FIAT",

                            wallet_currency:
                                destinationCurrency,

                            wallet_status: "ACTIVE",

                            account_balance:
                                latestDestinationWallet.account_balance,
                        },
                    },
                },
                {
                    $set: {
                        [`wallets_details.${destinationWalletIndex}.account_balance`]:
                            mongoose.Types.Decimal128.fromString(
                                newDestinationBalance.toFixed(2)
                            ),
                    },
                },
                {
                    session: mongoSession,
                }
            );


        if (
            destinationWalletUpdateResult.modifiedCount !==
            1
        ) {
            throw new ServiceError(
                "Destination wallet balance changed before currency conversion"
            );
        }


        // --------------------------------------------------
        // SOURCE TRANSACTION
        //
        // Conversion out of source wallet
        // --------------------------------------------------

        const sourceTransactionId =
            crypto.randomUUID();


        await user_wallet_transactions.create(
            [
                {
                    cardholder_id:
                        cardholderId,

                    wallet_id:
                        walletDetails.wallet_id,

                    transaction_id:
                        sourceTransactionId,

                    transaction_type:
                        "WITHDRAW",

                    transaction_status:
                        "SUCCESS",

                    wallet_details: {
                        wallet_type: "FIAT",

                        wallet_currency:
                            sourceCurrency,
                    },

                    amount:
                        mongoose.Types.Decimal128.fromString(
                            sourceAmount.toFixed(2)
                        ),

                    balance_before:
                        mongoose.Types.Decimal128.fromString(
                            sourceBalance.toFixed(2)
                        ),

                    balance_after:
                        mongoose.Types.Decimal128.fromString(
                            newSourceBalance.toFixed(2)
                        ),

                    reference_id:
                        conversionReferenceId,

                    remarks:
                        `Currency conversion from ${sourceCurrency} to ${destinationCurrency}.Fee: ${feeAmount.toFixed(2)} ${sourceCurrency} `,
                },
            ],
            {
                session: mongoSession,
            }
        );


        // --------------------------------------------------
        // DESTINATION TRANSACTION
        //
        // Conversion into destination wallet
        // --------------------------------------------------

        const destinationTransactionId =
            crypto.randomUUID();


        await user_wallet_transactions.create(
            [
                {
                    cardholder_id:
                        cardholderId,

                    wallet_id:
                        walletDetails.wallet_id,

                    transaction_id:
                        destinationTransactionId,

                    transaction_type:
                        "LOAD",

                    transaction_status:
                        "SUCCESS",

                    wallet_details: {
                        wallet_type: "FIAT",

                        wallet_currency:
                            destinationCurrency,
                    },

                    amount:
                        mongoose.Types.Decimal128.fromString(
                            destinationAmount.toFixed(2)
                        ),

                    balance_before:
                        mongoose.Types.Decimal128.fromString(
                            destinationBalance.toFixed(2)
                        ),

                    balance_after:
                        mongoose.Types.Decimal128.fromString(
                            newDestinationBalance.toFixed(2)
                        ),

                    reference_id:
                        conversionReferenceId,

                    remarks:
                        `Currency conversion from ${sourceCurrency} to ${destinationCurrency}. FX rate: ${exchangeRate.toFixed(8)} `,
                },
            ],
            {
                session: mongoSession,
            }
        );


        // --------------------------------------------------
        // Update conversion quote
        //
        // IMPORTANT:
        // Only do this if your quote schema contains
        // quote_status: "EXECUTED".
        // --------------------------------------------------

        const quoteUpdateResult =
            await wallet_currency_conversion_quote.updateOne(
                {
                    _id: conversionQuote._id,

                    quote_status: "ACTIVE",
                },
                {
                    $set: {
                        quote_status: "EXECUTED",

                        executed_at: new Date(),

                        conversion_reference_id:
                            conversionReferenceId,
                    },
                },
                {
                    session: mongoSession,
                }
            );


        if (
            quoteUpdateResult.modifiedCount !== 1
        ) {
            throw new ServiceError(
                "Currency conversion quote could not be marked as executed"
            );
        }


        // --------------------------------------------------
        // Commit transaction
        // --------------------------------------------------

        await mongoSession.commitTransaction();


        // --------------------------------------------------
        // Return result
        // --------------------------------------------------

        return {
            status: "SUCCESS",

            message:
                "Currency conversion completed successfully",

            data: {

                conversion_reference_id:
                    conversionReferenceId,

                source_currency:
                    sourceCurrency,

                destination_currency:
                    destinationCurrency,

                source_amount:
                    sourceAmount.toFixed(2),

                conversion_fee:
                    feeAmount.toFixed(2),

                amount_after_fee:
                    sourceAmount
                        .minus(feeAmount)
                        .toDecimalPlaces(2)
                        .toFixed(2),

                exchange_rate:
                    exchangeRate.toFixed(8),

                destination_amount:
                    destinationAmount.toFixed(2),

                source_balance_before:
                    sourceBalance.toFixed(2),

                source_balance_after:
                    newSourceBalance.toFixed(2),

                destination_balance_before:
                    destinationBalance.toFixed(2),

                destination_balance_after:
                    newDestinationBalance.toFixed(2),

                source_transaction_id:
                    sourceTransactionId,

                destination_transaction_id:
                    destinationTransactionId,

                quote_id:
                    conversionQuote._id.toString(),

                quote_status:
                    "EXECUTED",
            },
        };

    }
    catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName:
                    "ExecuteWalletCurrencyConversionTransaction",
            }
        );


        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(
            `ExecuteWalletCurrencyConversionTransaction facing issue: ${error.message} `,
            error?.error
                ? error.error
                : error
        );
    }
    finally {

        await mongoSession.endSession();

    }
};


export default executeWalletCurrencyConversionTransaction;