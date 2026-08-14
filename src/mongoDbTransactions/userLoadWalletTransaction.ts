// import mongoose, { Types } from "mongoose";
// import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
// import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
// import logger from "../utils/logger.js";
// import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
// import type { walletDetailsType } from "../types/schemaTypes.js";
// import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";
// import z from "zod";
// import type { SafeParseSuccess } from "zod/v3";
// import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
// import type { SafeParseResult } from "../types/zodTypes.js";
// import crypto from "crypto";

// type userWalletActionValidationType = SafeParseSuccess<z.infer<typeof userWalletActionValidationSchema>>;

// const userLoadWalletTransaction = async (userId: Types.ObjectId, cardholderId: Types.ObjectId, walletId: Types.ObjectId, userWalletActionData: userWalletActionValidationType, selectedWallet: walletDetailsType) => {
//     const mongoSession =
//         await mongoose.startSession();

//     try {
//         mongoSession.startTransaction();

//         // Configure updated wallet balance and dates
//         const loadAmount = userWalletActionData.data.amount;
//         const now = new Date();
//         const updateInc: Record<string, number> = { "wallets_details.$.account_balance": loadAmount };
//         const updateSet: Record<string, any> = {};
//         // Daily
//         const daily = selectedWallet.daily_transaction;
//         if (!daily?.date || daily.date.toDateString() !== now.toDateString()) {
//             updateSet["wallets_details.$.daily_transaction.credit"] = loadAmount;
//             updateSet["wallets_details.$.daily_transaction.date"] = now;
//         }
//         else {
//             updateInc["wallets_details.$.daily_transaction.credit"] = loadAmount;
//         }
//         // Monthly
//         const isSameMonth = selectedWallet.monthly_transaction?.month === now.getMonth() + 1 &&
//             selectedWallet.monthly_transaction?.year === now.getFullYear();

//         if (isSameMonth) {
//             updateInc["wallets_details.$.monthly_transaction.credit"] = loadAmount;
//         }
//         else {
//             updateSet["wallets_details.$.monthly_transaction.credit"] = loadAmount;
//             updateSet["wallets_details.$.monthly_transaction.month"] = now.getMonth() + 1;
//             updateSet["wallets_details.$.monthly_transaction.year"] = now.getFullYear();
//         }

//         // Yearly
//         const isSameYear = selectedWallet.yearly_transaction?.year === now.getFullYear();

//         if (isSameYear) {
//             updateInc["wallets_details.$.yearly_transaction.credit"] = loadAmount;
//         }
//         else {
//             updateSet["wallets_details.$.yearly_transaction.credit"] = loadAmount;
//             updateSet["wallets_details.$.yearly_transaction.year"] = now.getFullYear();
//         }

//         // Update wallet
//         const updatedWallet = await user_wallet_details.findOneAndUpdate(
//             {
//                 _id: walletId,
//                 wallets_details:
//                 {
//                     $elemMatch:
//                     {
//                         wallet_type: userWalletActionData.data.wallet_type,
//                         wallet_currency: userWalletActionData.data.wallet_currency,
//                     },
//                 },
//             },

//             {
//                 $inc: updateInc,
//                 $set: updateSet,
//             },

//             {
//                 new: true,
//                 session: mongoSession,
//             }
//         ).lean();

//         if (!updatedWallet) {
//             throw new ServiceError("Wallet update failed");
//         }

//         // Prepare transaction payload
//         const transactionPayload = {
//             transaction_type: "LOAD",
//             transaction_status: "SUCCESS",
//             wallet_details: {
//                 wallet_type: userWalletActionData.data.wallet_type,
//                 wallet_currency: userWalletActionData.data.wallet_currency
//             },
//             amount: userWalletActionData.data.amount,
//             balance_before: selectedWallet.account_balance ?? 0,
//             balance_after: (Number(selectedWallet?.account_balance?.toString()) ?? 0) + userWalletActionData.data.amount,
//             reference_id: crypto.randomUUID(),
//             remarks: "Wallet loaded",
//         };

//         // Check Transaction Validations
//         const validationResult: SafeParseResult<z.infer<typeof userWalletTransactionsValidationSchema>> = userWalletTransactionsValidationSchema.safeParse(transactionPayload);
//         if (!validationResult.success) {
//             // return res.status(400).json({
//             //     status: "SERVICE_ERROR",
//             //     message: "Invalid request body",
//             //     // errors: validationResult.error.issues.map(issue => issue.message)
//             //     // errors: validationResult.error.issues.map(issue => ({
//             //     //     [issue.path.join(".")]: issue.message
//             //     // }))
//             //     errors: z.flattenError(validationResult.error)
//             // });
//             throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
//         }

//         // Create load transaction entry
//         await user_wallet_transactions.create(
//             [
//                 {
//                     cardholder_id: cardholderId,
//                     wallet_id: walletId,
//                     transaction_id: new Types.ObjectId(),
//                     transaction_type: validationResult?.data?.transaction_type,
//                     transaction_status: validationResult?.data?.transaction_status,
//                     wallet_details: {
//                         wallet_type: validationResult?.data?.wallet_details?.wallet_type,
//                         wallet_currency: validationResult?.data?.wallet_details?.wallet_currency,
//                     },
//                     amount: validationResult.data.amount,
//                     balance_before: validationResult?.data?.balance_before,
//                     balance_after: validationResult?.data?.balance_after,
//                     reference_id: validationResult?.data?.reference_id,
//                     remarks: validationResult?.data?.remarks,
//                 },
//             ],
//             {
//                 session: mongoSession,
//             }
//         );

//         await mongoSession.commitTransaction();

//         const walletDetails = {
//             walletId: updatedWallet?._id?.toString(),
//             wallets_details: updatedWallet?.wallets_details
//         }

//         return { status: "SUCCESS", message: "Wallet loaded successfully", data: walletDetails }
//     }
//     catch (err) {
//         await mongoSession.abortTransaction();

//         const error = err as any;
//         // const url = req?.path || "UNKNOWN_URL";
//         const errorStatus = error?.status || "UnknownErrorStatus";

//         logger.error(error, {
//             serviceName: "LoadWalletTransactionService",
//             // url: req.path,
//             // method: req.method
//         });

//         if (error instanceof AppErrorClass) {
//             throw error
//         }
//         throw new ServiceError(
//             `LoadWalletTransactionService facing issue: [${errorStatus}] ${error.message}`,
//             error?.error ? error.error : error
//         );

//     }
//     finally {
//         await mongoSession.endSession();
//     }
// }

// export default userLoadWalletTransaction;



import mongoose, { Types } from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userFundingBankAccountDetailsModel as user_funding_bank_account_details } from "../models/user_funding_bank_account_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";
import z from "zod";
import type { SafeParseSuccess } from "zod/v3";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import crypto from "crypto";
import { getFxRate } from "../services/fxRateService.js";

type userWalletActionValidationType =
    SafeParseSuccess<
        z.infer<typeof userWalletActionValidationSchema>
    >;


const userLoadWalletTransaction = async (
    userId: Types.ObjectId,
    cardholderId: Types.ObjectId,
    walletId: Types.ObjectId,
    userWalletActionData: userWalletActionValidationType,
    selectedWallet: walletDetailsType
) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();


        // ============================================================
        // BASIC DATA
        // ============================================================

        const walletType =
            userWalletActionData.data.wallet_type;

        const walletCurrency =
            userWalletActionData.data.wallet_currency
                .trim()
                .toUpperCase();

        const loadAmount =
            userWalletActionData.data.amount;

        const now = new Date();


        if (loadAmount <= 0) {
            throw new ServiceError(
                "Wallet load amount must be greater than zero"
            );
        }


        // ============================================================
        // DETERMINE WALLET TYPE
        // ============================================================

        const isFiatWallet =
            walletType.toLowerCase() === "fiat";

        const isCryptoWallet =
            walletType.toLowerCase() === "crypto";


        if (!isFiatWallet && !isCryptoWallet) {
            throw new ServiceError(
                `Unsupported wallet type: ${walletType}`
            );
        }


        // ============================================================
        // VARIABLES
        // ============================================================

        let sourceCurrency = walletCurrency;
        let sourceAmount = loadAmount;
        let exchangeRate = 1;

        let remarks = "Wallet loaded successfully";


        // ============================================================
        // FIAT WALLET LOAD
        // ============================================================
        //
        // Example:
        //
        // User requests:
        // 100 SGD
        //
        // Funding account:
        // USD
        //
        // FX:
        // 1 USD = 1.28 SGD
        //
        // USD required:
        // 100 / 1.28 = 78.125 USD
        //
        // Funding account:
        // $1000
        //
        // After:
        // $921.875
        //
        // SGD wallet:
        // +100 SGD
        //
        // ============================================================

        if (isFiatWallet) {

            sourceCurrency = "USD";


            // --------------------------------------------------------
            // Get USD -> Wallet Currency FX rate
            // --------------------------------------------------------

            const fxRateResponse = await getFxRate(
                sourceCurrency,
                walletCurrency
            );

            exchangeRate =
                fxRateResponse.exchange_rate;


            if (!exchangeRate || exchangeRate <= 0) {
                throw new ServiceError(
                    `Invalid FX rate for ${sourceCurrency} to ${walletCurrency}`
                );
            }


            // --------------------------------------------------------
            // Calculate USD amount required
            // --------------------------------------------------------
            //
            // destination amount / FX rate
            //
            // Example:
            //
            // 100 SGD / 1.28
            // = 78.125 USD
            //
            // --------------------------------------------------------

            sourceAmount =
                loadAmount / exchangeRate;


            // Avoid floating-point precision issues
            sourceAmount =
                Number(sourceAmount.toFixed(18));


            if (!Number.isFinite(sourceAmount) || sourceAmount <= 0) {
                throw new ServiceError(
                    "Invalid source amount calculated from FX rate"
                );
            }


            // --------------------------------------------------------
            // Find and deduct USD funding account
            // --------------------------------------------------------
            //
            // The $gte condition is extremely important.
            //
            // It makes sure that the funding account cannot become
            // negative.
            //
            // This update is also atomic.
            //
            // --------------------------------------------------------

            const sourceAmountDecimal =
                mongoose.Types.Decimal128.fromString(
                    sourceAmount.toFixed(18)
                );


            const updatedFundingAccount =
                await user_funding_bank_account_details.findOneAndUpdate(
                    {
                        user_id: userId,
                        cardholder_id: cardholderId,
                        account_currency: "USD",
                        is_active: true,

                        account_balance: {
                            $gte: sourceAmountDecimal
                        }
                    },
                    {
                        $inc: {
                            account_balance: mongoose.Types.Decimal128.fromString(
                                (-sourceAmount).toFixed(18)
                            )
                        }
                    },
                    {
                        new: true,
                        session: mongoSession
                    }
                ).lean();


            if (!updatedFundingAccount) {
                throw new ServiceError(
                    "Insufficient USD funding account balance or active funding account not found"
                );
            }


            remarks =
                `Wallet loaded from USD funding account. ` +
                `FX rate: 1 USD = ${exchangeRate} ${walletCurrency}. ` +
                `USD deducted: ${sourceAmount}.`;


        }


        // ============================================================
        // CRYPTO WALLET LOAD
        // ============================================================
        //
        // For the current mock implementation:
        //
        // USDT / USDC
        //      ↓
        // Directly credit crypto wallet
        //
        // No USD funding account is touched.
        //
        // Later, this branch should be triggered after verifying an
        // actual blockchain deposit.
        //
        // ============================================================

        if (isCryptoWallet) {

            const supportedCryptoCurrencies = [
                "USDT",
                "USDC"
            ];


            if (
                !supportedCryptoCurrencies.includes(walletCurrency)
            ) {
                throw new ServiceError(
                    `Unsupported crypto wallet currency: ${walletCurrency}`
                );
            }


            sourceCurrency = walletCurrency;
            sourceAmount = loadAmount;
            exchangeRate = 1;


            remarks =
                `${walletCurrency} wallet loaded successfully from crypto deposit.`;


        }


        // ============================================================
        // PREPARE WALLET BALANCE UPDATE
        // ============================================================

        const updateInc: Record<string, number> = {
            "wallets_details.$.account_balance": loadAmount
        };

        const updateSet: Record<string, any> = {};


        // ============================================================
        // DAILY TRANSACTION
        // ============================================================

        const daily =
            selectedWallet.daily_transaction;


        if (
            !daily?.date ||
            daily.date.toDateString() !== now.toDateString()
        ) {

            updateSet[
                "wallets_details.$.daily_transaction.credit"
            ] = loadAmount;

            updateSet[
                "wallets_details.$.daily_transaction.date"
            ] = now;

        }
        else {

            updateInc[
                "wallets_details.$.daily_transaction.credit"
            ] = loadAmount;

        }


        // ============================================================
        // MONTHLY TRANSACTION
        // ============================================================

        const isSameMonth =
            selectedWallet.monthly_transaction?.month ===
            now.getMonth() + 1 &&
            selectedWallet.monthly_transaction?.year ===
            now.getFullYear();


        if (isSameMonth) {

            updateInc[
                "wallets_details.$.monthly_transaction.credit"
            ] = loadAmount;

        }
        else {

            updateSet[
                "wallets_details.$.monthly_transaction.credit"
            ] = loadAmount;

            updateSet[
                "wallets_details.$.monthly_transaction.month"
            ] = now.getMonth() + 1;

            updateSet[
                "wallets_details.$.monthly_transaction.year"
            ] = now.getFullYear();

        }


        // ============================================================
        // YEARLY TRANSACTION
        // ============================================================

        const isSameYear =
            selectedWallet.yearly_transaction?.year ===
            now.getFullYear();


        if (isSameYear) {

            updateInc[
                "wallets_details.$.yearly_transaction.credit"
            ] = loadAmount;

        }
        else {

            updateSet[
                "wallets_details.$.yearly_transaction.credit"
            ] = loadAmount;

            updateSet[
                "wallets_details.$.yearly_transaction.year"
            ] = now.getFullYear();

        }


        // ============================================================
        // UPDATE USER WALLET
        // ============================================================

        const updatedWallet =
            await user_wallet_details.findOneAndUpdate(
                {
                    _id: walletId,

                    wallets_details: {
                        $elemMatch: {
                            wallet_type: walletType,
                            wallet_currency: walletCurrency
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
            throw new ServiceError(
                "Wallet update failed"
            );
        }


        // ============================================================
        // CALCULATE WALLET BALANCES
        // ============================================================

        const balanceBefore =
            Number(
                selectedWallet.account_balance?.toString() ?? "0"
            );

        const balanceAfter =
            balanceBefore + loadAmount;


        // ============================================================
        // PREPARE TRANSACTION PAYLOAD
        // ============================================================

        const transactionPayload = {

            transaction_type: "LOAD",

            transaction_status: "SUCCESS",

            wallet_details: {
                wallet_type: walletType,
                wallet_currency: walletCurrency
            },

            amount: loadAmount,

            balance_before: balanceBefore,

            balance_after: balanceAfter,

            reference_id: crypto.randomUUID(),

            remarks: remarks
        };


        // ============================================================
        // VALIDATE TRANSACTION
        // ============================================================

        const validationResult:
            SafeParseResult<
                z.infer<typeof userWalletTransactionsValidationSchema>
            > =
            userWalletTransactionsValidationSchema.safeParse(
                transactionPayload
            );


        if (!validationResult.success) {

            throw new ServiceError(
                "Invalid wallet transaction request",
                z.flattenError(
                    validationResult.error
                )
            );

        }


        // ============================================================
        // CREATE WALLET TRANSACTION
        // ============================================================

        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderId,

                    wallet_id: walletId,

                    transaction_id:
                        new Types.ObjectId(),

                    transaction_type:
                        validationResult.data.transaction_type,

                    transaction_status:
                        validationResult.data.transaction_status,

                    wallet_details: {
                        wallet_type:
                            validationResult.data.wallet_details
                                ?.wallet_type,

                        wallet_currency:
                            validationResult.data.wallet_details
                                ?.wallet_currency
                    },

                    amount:
                        validationResult.data.amount,

                    balance_before:
                        validationResult.data.balance_before,

                    balance_after:
                        validationResult.data.balance_after,

                    reference_id:
                        validationResult.data.reference_id,

                    remarks:
                        validationResult.data.remarks
                }
            ],
            {
                session: mongoSession
            }
        );


        // ============================================================
        // COMMIT TRANSACTION
        // ============================================================

        await mongoSession.commitTransaction();


        // ============================================================
        // RESPONSE
        // ============================================================

        const walletDetails = {

            walletId:
                updatedWallet?._id?.toString(),

            wallets_details:
                updatedWallet?.wallets_details,

            source_currency:
                sourceCurrency,

            source_amount:
                sourceAmount,

            destination_currency:
                walletCurrency,

            destination_amount:
                loadAmount,

            exchange_rate:
                exchangeRate

        };


        return {
            status: "SUCCESS",

            message:
                "Wallet loaded successfully",

            data:
                walletDetails
        };


    }
    catch (err) {

        await mongoSession.abortTransaction();


        const error = err as any;

        const errorStatus =
            error?.status ||
            "UnknownErrorStatus";


        logger.error(
            error,
            {
                serviceName:
                    "LoadWalletTransactionService"
            }
        );


        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(
            `LoadWalletTransactionService facing issue: [${errorStatus}] ${error.message}`,
            error?.error
                ? error.error
                : error
        );

    }
    finally {

        await mongoSession.endSession();

    }
};


export default userLoadWalletTransaction;