import mongoose, { Types } from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userFundingBankAccountDetailsModel as user_funding_bank_account_details } from "../models/user_funding_bank_account_details.js";
import { userCryptoDepositAccountDetailsModel as user_crypto_deposit_account_details } from "../models/user_crypto_deposit_accout_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import z from "zod";
import type { SafeParseSuccess } from "zod/v3";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import crypto from "crypto";
import { getFxRate } from "../services/fxRateService.js";
import { Decimal } from "decimal.js";
import { calculateFeeAddedAmountService } from "../services/calculateFeeAddedAmountService.js";
import type { loadWalletValidationSchema } from "../validations/userWalletActionValidation.js";

type loadWalletValidationType = SafeParseSuccess<z.infer<typeof loadWalletValidationSchema>>;

const userLoadWalletTransaction = async (
    userId: Types.ObjectId,
    cardholderId: Types.ObjectId,
    walletId: Types.ObjectId,
    userWalletActionData: loadWalletValidationType,
    selectedWallet: walletDetailsType
) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        const walletType = userWalletActionData.data.wallet_type;
        const walletCurrency = userWalletActionData.data.wallet_currency.trim().toUpperCase();

        const loadAmount = new Decimal(userWalletActionData.data.amount.toString());
        if (!loadAmount.isFinite() || loadAmount.lte(0)) {
            throw new ServiceError("Wallet load amount must be greater than zero");
        }


        let feeAmount = new Decimal(0);
        let totalSourceAmount = new Decimal(0);

        const now = new Date();

        // Determine wallet type
        const isFiatWallet = walletType.toUpperCase() === "FIAT";
        const isCryptoWallet = walletType.toUpperCase() === "CRYPTO";


        if (!isFiatWallet && !isCryptoWallet) {
            throw new ServiceError(
                `Unsupported wallet type: ${walletType}`
            );
        }


        let sourceCurrency = walletCurrency;
        let sourceAmount = loadAmount;
        let exchangeRate = 1;

        let remarks = "Wallet loaded successfully";


        // ------------------------------------------
        // FIAT WALLET LOAD
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
        // ------------------------------------------

        if (isFiatWallet) {
            sourceCurrency = "USD";

            // Get fx rate
            const fxRateResponse = await getFxRate(sourceCurrency, walletCurrency);
            exchangeRate = fxRateResponse.exchange_rate;
            if (!exchangeRate || exchangeRate <= 0) {
                throw new ServiceError(
                    `Invalid FX rate for ${sourceCurrency} to ${walletCurrency}`
                );
            }


            // --------------------------------------------------------
            // Calculate USD amount required
            //
            // destination amount / FX rate
            //
            // Example:
            //
            // 100 SGD / 1.28
            // = 78.125 USD
            //
            // --------------------------------------------------------
            const sourceAmountDecimal = new Decimal(loadAmount).div(exchangeRate);
            if (!sourceAmountDecimal.isFinite() || sourceAmountDecimal.lte(0)) {
                throw new ServiceError(
                    "Invalid source amount calculated from FX rate"
                );
            }
            sourceAmount = sourceAmountDecimal.toDecimalPlaces(4);

            // Calculate fee on the source amount
            feeAmount = calculateFeeAddedAmountService(
                sourceAmountDecimal,
                "load_fiat_wallet_percent"
            );

            // Total amount to deduct from funding account
            totalSourceAmount = sourceAmountDecimal.plus(feeAmount);
            if (!totalSourceAmount.isFinite() || totalSourceAmount.lte(0)) {
                throw new ServiceError(
                    "Invalid total funding amount calculated"
                );
            }

            // Find and deduct from the usd funding account
            const totalSourceAmountDecimal = mongoose.Types.Decimal128.fromString(totalSourceAmount.toDecimalPlaces(4).toString());
            const updatedFundingAccount = await user_funding_bank_account_details.findOneAndUpdate(
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    account_currency: "USD",
                    is_active: true,

                    account_balance: {
                        $gte: totalSourceAmountDecimal
                    }
                },
                {
                    $inc: {
                        account_balance: mongoose.Types.Decimal128.fromString(
                            totalSourceAmount.negated().toDecimalPlaces(4).toString()
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


            remarks = `Wallet loaded from USD funding account. ` + `FX rate: 1 USD = ${exchangeRate} ${walletCurrency}. ` + `USD amount: ${sourceAmount}. ` + `Fee: ${feeAmount.toString()} USD. ` + `Total USD deducted: ${totalSourceAmount.toString()}.`;
        }

        // ============================================================
        // CRYPTO WALLET LOAD
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

            if (!supportedCryptoCurrencies.includes(walletCurrency)) {
                throw new ServiceError(
                    `Unsupported crypto wallet currency: ${walletCurrency}`
                );
            }

            // Crypto wallet receives exactly the amount requested by the user
            sourceCurrency = walletCurrency;
            sourceAmount = loadAmount;
            exchangeRate = 1;

            // Calculate crypto funding fee
            const sourceAmountDecimal = new Decimal(loadAmount);

            if (!sourceAmountDecimal.isFinite() || sourceAmountDecimal.lte(0)) {
                throw new ServiceError(
                    "Invalid crypto source amount"
                );
            }

            feeAmount = calculateFeeAddedAmountService(
                sourceAmountDecimal,
                "load_crypto_wallet_percent"
            );

            // Total crypto amount to deduct from crypto funding account
            totalSourceAmount = sourceAmountDecimal.plus(feeAmount);

            if (!totalSourceAmount.isFinite() || totalSourceAmount.lte(0)) {
                throw new ServiceError(
                    "Invalid total crypto funding amount calculated"
                );
            }

            // Convert total deduction to Mongo Decimal128
            const totalSourceAmountDecimal = mongoose.Types.Decimal128.fromString(totalSourceAmount.toDecimalPlaces(4).toString());

            // Deduct from user's crypto funding account
            const updatedCryptoFundingAccount = await user_crypto_deposit_account_details.findOneAndUpdate(
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    network: userWalletActionData.data.network as "ETHEREUM" | "POLYGON",
                    asset: walletCurrency as "USDT" | "USDC",
                    is_active: true,

                    // Make sure the account has enough
                    // balance for amount + fee
                    account_balance: {
                        $gte: totalSourceAmountDecimal
                    }
                },
                {
                    $inc: {
                        account_balance:
                            mongoose.Types.Decimal128.fromString(
                                totalSourceAmount
                                    .negated()
                                    .toDecimalPlaces(4)
                                    .toString()
                            )
                    }
                },
                {
                    new: true,
                    session: mongoSession
                }
            ).lean();

            if (!updatedCryptoFundingAccount) {
                throw new ServiceError(
                    `Insufficient ${walletCurrency} crypto funding account balance or active crypto funding account not found`
                );
            }

            // ---------------------------------------------
            // Transaction remarks
            // ---------------------------------------------

            remarks = `Wallet loaded from ${walletCurrency} ${userWalletActionData.data.network} crypto funding account. ` + `Crypto amount: ${sourceAmount}. ` + `Fee: ${feeAmount.toString()} ${walletCurrency}. ` + `Total ${walletCurrency} deducted: ${totalSourceAmount.toString()}.`;
        }

        const loadAmountDecimal128 = mongoose.Types.Decimal128.fromString(loadAmount.toDecimalPlaces(4).toString());

        // Update the wallet balance
        const updateInc: Record<string, mongoose.Types.Decimal128> = {
            "wallets_details.$.account_balance": loadAmountDecimal128,
            "wallets_details.$.available_balance": loadAmountDecimal128,
        };

        const updateSet: Record<string, any> = {};

        // Daily transaction
        const daily = selectedWallet.daily_transaction;
        if (!daily?.date || daily.date.toDateString() !== now.toDateString()) {
            updateSet[
                "wallets_details.$.daily_transaction.credit"
            ] = loadAmountDecimal128;

            updateSet[
                "wallets_details.$.daily_transaction.date"
            ] = now;
        }
        else {
            updateInc[
                "wallets_details.$.daily_transaction.credit"
            ] = loadAmountDecimal128;

        }

        // Monthly Transaction
        const isSameMonth = selectedWallet.monthly_transaction?.month === now.getMonth() + 1 && selectedWallet.monthly_transaction?.year === now.getFullYear();
        if (isSameMonth) {
            updateInc[
                "wallets_details.$.monthly_transaction.credit"
            ] = loadAmountDecimal128;
        }
        else {
            updateSet[
                "wallets_details.$.monthly_transaction.credit"
            ] = loadAmountDecimal128;

            updateSet[
                "wallets_details.$.monthly_transaction.month"
            ] = now.getMonth() + 1;

            updateSet[
                "wallets_details.$.monthly_transaction.year"
            ] = now.getFullYear();
        }

        // Yearly transaction
        const isSameYear = selectedWallet.yearly_transaction?.year === now.getFullYear();
        if (isSameYear) {
            updateInc[
                "wallets_details.$.yearly_transaction.credit"
            ] = loadAmountDecimal128;
        }
        else {
            updateSet[
                "wallets_details.$.yearly_transaction.credit"
            ] = loadAmountDecimal128;

            updateSet[
                "wallets_details.$.yearly_transaction.year"
            ] = now.getFullYear();
        }

        // Update user wallet
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                _id: walletId,
                user_id: userId,
                cardholder_id: cardholderId,

                wallets_details: {
                    $elemMatch: {
                        wallet_type: walletType,
                        wallet_currency: walletCurrency,

                        // Optimistic concurrency check
                        account_balance: selectedWallet.account_balance,
                        available_balance: selectedWallet.available_balance,
                        holding_amount: selectedWallet.holding_amount,
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

        // Calculate wallet balance
        const balanceBefore = new Decimal(selectedWallet.account_balance?.toString() ?? "0");
        const availableBalanceBefore = new Decimal(selectedWallet.available_balance?.toString() ?? "0");
        const holdingAmountBefore = new Decimal(selectedWallet.holding_amount?.toString() ?? "0");
        if (!balanceBefore.isFinite() || balanceBefore.lt(0)) {
            throw new ServiceError("Invalid wallet account balance");
        }
        if (!availableBalanceBefore.isFinite() || availableBalanceBefore.lt(0)) {
            throw new ServiceError("Invalid wallet available balance");
        }
        if (!holdingAmountBefore.isFinite() || holdingAmountBefore.lt(0)) {
            throw new ServiceError("Invalid wallet holding amount");
        }
        // Validate wallet balance relationship
        if (!availableBalanceBefore.plus(holdingAmountBefore).toDecimalPlaces(4).equals(balanceBefore.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${walletCurrency} wallet balance`);
        }
        const balanceAfter = balanceBefore.plus(loadAmount).toDecimalPlaces(4);
        const availableBalanceAfter = availableBalanceBefore.plus(loadAmount).toDecimalPlaces(4);
        const holdingAmountAfter = holdingAmountBefore.toDecimalPlaces(4);
        // Validate the balance relationship after the load
        if (!availableBalanceAfter.plus(holdingAmountAfter).toDecimalPlaces(4).equals(balanceAfter.toDecimalPlaces(4))) {
            throw new ServiceError(`Invalid ${walletCurrency} wallet balance after load`);
        }
        const balanceBeforeDecimal128 = mongoose.Types.Decimal128.fromString(balanceBefore.toDecimalPlaces(4).toString());
        const balanceAfterDecimal128 = mongoose.Types.Decimal128.fromString(balanceAfter.toDecimalPlaces(4).toString());

        // Transaction payload
        const transactionPayload = {
            transaction_type: "LOAD",
            transaction_status: "SUCCESS",
            wallet_details: {
                wallet_type: walletType,
                wallet_currency: walletCurrency,
                network: userWalletActionData.data.network
            },
            amount: Number(loadAmount.toString()),
            balance_before: Number(balanceBefore.toString()),
            balance_after: Number(balanceAfter.toString()),
            reference_id: crypto.randomUUID(),
            remarks: remarks
        };


        // Validate transaction payload
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


        // Create wallet transaction
        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderId,
                    wallet_id: walletId,
                    transaction_id: new Types.ObjectId(),
                    transaction_type: validationResult.data.transaction_type,
                    transaction_status: validationResult.data.transaction_status,
                    wallet_details: {
                        wallet_type: validationResult.data.wallet_details?.wallet_type,
                        wallet_currency: validationResult.data.wallet_details?.wallet_currency
                    },
                    amount: loadAmountDecimal128,
                    balance_before: balanceBeforeDecimal128,
                    balance_after: balanceAfterDecimal128,
                    reference_id: validationResult.data.reference_id,
                    remarks: validationResult.data.remarks
                }
            ],
            {
                session: mongoSession
            }
        );


        // Commit Transaction
        await mongoSession.commitTransaction();

        const walletDetails = {
            walletId: updatedWallet?._id?.toString(),
            wallets_details: updatedWallet?.wallets_details,
            source_currency: sourceCurrency,
            source_amount: sourceAmount,
            fee_amount: feeAmount.toString(),
            total_source_amount: totalSourceAmount.toString(),
            destination_currency: walletCurrency,
            destination_amount: loadAmount,
            exchange_rate: exchangeRate
        };


        return {
            status: "SUCCESS",
            message: "Wallet loaded successfully",
            data: walletDetails
        };


    }
    catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(
            error,
            {
                serviceName: "LoadWalletTransactionService"
            }
        );


        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(
            `LoadWalletTransactionService facing issue: [${errorStatus}] ${error.message}`, error?.error ? error.error : error);
    }
    finally {

        await mongoSession.endSession();

    }
};


export default userLoadWalletTransaction;