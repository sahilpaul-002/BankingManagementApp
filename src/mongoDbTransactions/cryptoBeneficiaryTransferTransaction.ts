import mongoose, { Types } from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, NotFoundError, ServiceError } from "../utils/AppErrorClass.js";
import { Decimal } from "decimal.js";
import crypto from "crypto";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import getWalletFxRate from "../services/walletFxRateService.js";
import { FEE_DETAILS } from "../configs/configConstants.js";

type cryptoWalletCurrencyType = "USDC" | "USDT";

type CreateBeneficiaryTransferTransactionDataType = {
    userId: Types.ObjectId;
    sourceCurrency: cryptoWalletCurrencyType;
    destinationNetwork: string;
    destinationAddress: string;
    amount: Decimal;
};

const createBeneficiaryTransferTransaction = async (
    transactionData: CreateBeneficiaryTransferTransactionDataType
) => {
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        const { userId, sourceCurrency, destinationNetwork, destinationAddress, amount } = transactionData;

        const now = new Date();

        // Get User Wallet Details
        const userWalletDetails = await user_wallet_details.findOne({ user_id: userId }).session(mongoSession);
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet details not found");
        }
        if (!userWalletDetails.wallets_details || userWalletDetails.wallets_details.length === 0) {
            throw new NotFoundError("User wallets not found");
        }

        // Find Usd Fiat Wallet
        const usdWalletIndex = userWalletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === "FIAT" &&
                wallet.wallet_currency === "USD" &&
                wallet.wallet_status === "ACTIVE"
        );
        if (usdWalletIndex === -1) {
            throw new NotFoundError("Active USD fiat wallet not found");
        }
        const usdWallet = userWalletDetails.wallets_details[usdWalletIndex];
        if (!usdWallet) {
            throw new ServiceError("USD wallet details not found");
        }

        // Find Source Crypto Wallet
        const sourceWalletIndex = userWalletDetails.wallets_details.findIndex(
            (wallet) =>
                wallet.wallet_type === "CRYPTO" &&
                wallet.wallet_currency === sourceCurrency &&
                wallet.wallet_status === "ACTIVE"
        );
        if (sourceWalletIndex === -1) {
            throw new NotFoundError(`Active ${sourceCurrency} crypto wallet not found`);
        }
        const sourceWallet = userWalletDetails.wallets_details[sourceWalletIndex];
        if (!sourceWallet) {
            throw new ServiceError(`Source ${sourceCurrency} wallet details not found`);
        }

        // Validate Source Wallet Consistency
        const sourceAccountBalance = new Decimal(sourceWallet.account_balance?.toString() ?? "0");
        const sourceAvailableBalance = new Decimal(sourceWallet.available_balance?.toString() ?? "0");
        const sourceHoldingAmount = new Decimal(sourceWallet.holding_amount?.toString() ?? "0");
        const calculatedSourceAvailableBalance = sourceAccountBalance.minus(sourceHoldingAmount);
        if (!calculatedSourceAvailableBalance.eq(sourceAvailableBalance)) {
            throw new ServiceError(`Wallet balance inconsistency detected for ${sourceCurrency} wallet`);
        }

        // Validate USD Wallet Consistency
        const usdAccountBalance = new Decimal(usdWallet.account_balance?.toString() ?? "0");
        const usdAvailableBalance = new Decimal(usdWallet.available_balance?.toString() ?? "0");
        const usdHoldingAmount = new Decimal(usdWallet.holding_amount?.toString() ?? "0");
        const calculatedUsdAvailableBalance = usdAccountBalance.minus(usdHoldingAmount);
        if (!calculatedUsdAvailableBalance.eq(usdAvailableBalance)) {
            throw new ServiceError("Wallet balance inconsistency detected for USD wallet");
        }

        // Validate Source Amount
        if (amount.lessThanOrEqualTo(0)) {
            throw new ServiceError("Transfer amount must be greater than 0");
        }
        if (sourceAvailableBalance.lessThan(amount)) {
            throw new ServiceError(`Insufficient ${sourceCurrency} wallet balance`);
        }

        // Get Source to USD Wallet FX Rate
        const sourceToUsdWalletFxRateDetails = await getWalletFxRate(sourceCurrency, "USD");
        const sourceToUsdWalletExchangeRate = new Decimal(sourceToUsdWalletFxRateDetails.exchange_rate.toString());
        if (sourceToUsdWalletExchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid source to USD wallet FX rate received");
        }

        // Calculate Source Amount in USD
        const sourceAmountUsd = amount.mul(sourceToUsdWalletExchangeRate).toDecimalPlaces(4);

        // Get Fee Percentage and Calculate Fee Amount in USD
        const feePercentage = new Decimal(FEE_DETAILS.crypto_payout.toString());
        const feeAmountUsd = sourceAmountUsd.mul(feePercentage).div(100).toDecimalPlaces(4);
        if (feeAmountUsd.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid crypto payout fee calculated");
        }

        // Validate USD Wallet Balance for Fee Deduction
        if (usdAvailableBalance.lessThan(feeAmountUsd)) {
            throw new ServiceError("Insufficient USD wallet balance for payout fee");
        }

        // Calculate New Source Wallet Balances
        const newSourceAccountBalance = sourceAccountBalance.minus(amount);
        const newSourceAvailableBalance = sourceAvailableBalance.minus(amount);
        const newSourceHoldingAmount = sourceHoldingAmount;

        // Calculate New USD Wallet Balances
        const newUsdAccountBalance = usdAccountBalance.minus(feeAmountUsd);
        const newUsdAvailableBalance = usdAvailableBalance.minus(feeAmountUsd);
        const newUsdHoldingAmount = usdHoldingAmount;

        // Common Transaction Reference Id for both Transactions
        const transferReferenceId = crypto.randomUUID();

        // Update Source Crypto Wallet
        const sourceWalletUpdateFilter: Record<string, unknown> = {
            _id: userWalletDetails._id,
            wallets_details: {
                $elemMatch: {
                    wallet_type: "CRYPTO",
                    wallet_currency: sourceCurrency,
                    wallet_status: "ACTIVE",
                    account_balance: sourceWallet.account_balance,
                    available_balance: sourceWallet.available_balance,
                    holding_amount: sourceWallet.holding_amount,
                },
            },
        };

        const sourceWalletUpdate: Record<string, unknown> = {
            $set: {
                [`wallets_details.${sourceWalletIndex}.account_balance`]: mongoose.Types.Decimal128.fromString(newSourceAccountBalance.toFixed(4)),
                [`wallets_details.${sourceWalletIndex}.available_balance`]: mongoose.Types.Decimal128.fromString(newSourceAvailableBalance.toFixed(4)),
                [`wallets_details.${sourceWalletIndex}.holding_amount`]: mongoose.Types.Decimal128.fromString(newSourceHoldingAmount.toFixed(4)),
            },
        };

        // Daily debit
        const existingDailyDate = sourceWallet.daily_transaction?.date;
        const sameDailyDate = existingDailyDate && existingDailyDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
        if (sameDailyDate) {
            sourceWalletUpdate.$inc = {
                [`wallets_details.${sourceWalletIndex}.daily_transaction.debit`]: mongoose.Types.Decimal128.fromString(amount.toFixed(4)),
            };
        } else {
            sourceWalletUpdate.$set = {
                ...(sourceWalletUpdate.$set as Record<string, unknown>),
                [`wallets_details.${sourceWalletIndex}.daily_transaction.debit`]: mongoose.Types.Decimal128.fromString(amount.toFixed(4)),
                [`wallets_details.${sourceWalletIndex}.daily_transaction.date`]: now,
            };
        }

        // Monthly debit
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const existingMonthlyMonth = sourceWallet.monthly_transaction?.month;
        const existingMonthlyYear = sourceWallet.monthly_transaction?.year;
        if (existingMonthlyMonth === currentMonth && existingMonthlyYear === currentYear) {
            sourceWalletUpdate.$inc = {
                ...(sourceWalletUpdate.$inc as Record<string, unknown>),
                [`wallets_details.${sourceWalletIndex}.monthly_transaction.debit`]: mongoose.Types.Decimal128.fromString(amount.toFixed(4)),
            };
        } else {
            sourceWalletUpdate.$set = {
                ...(sourceWalletUpdate.$set as Record<string, unknown>),
                [`wallets_details.${sourceWalletIndex}.monthly_transaction.debit`]: mongoose.Types.Decimal128.fromString(
                    amount.toFixed(4)),
                [`wallets_details.${sourceWalletIndex}.monthly_transaction.month`]: currentMonth,
                [`wallets_details.${sourceWalletIndex}.monthly_transaction.year`]: currentYear,
            };
        }

        // Yearly debit
        const existingYear = sourceWallet.yearly_transaction?.year;
        if (existingYear === currentYear) {
            sourceWalletUpdate.$inc = {
                ...(sourceWalletUpdate.$inc as Record<string, unknown>),
                [`wallets_details.${sourceWalletIndex}.yearly_transaction.debit`]: mongoose.Types.Decimal128.fromString(amount.toFixed(4)),
            };
        } else {
            sourceWalletUpdate.$set = {
                ...(sourceWalletUpdate.$set as Record<string, unknown>),
                [`wallets_details.${sourceWalletIndex}.yearly_transaction.debit`]: mongoose.Types.Decimal128.fromString(amount.toFixed(4)),
                [`wallets_details.${sourceWalletIndex}.yearly_transaction.year`]: currentYear,
            };
        }
        const sourceWalletUpdateResult = await user_wallet_details.updateOne(
            sourceWalletUpdateFilter,
            sourceWalletUpdate,
            {
                session: mongoSession,
            }
        );
        if (sourceWalletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError(` ${sourceCurrency} wallet balance changed before crypto payout execution. Please retry.`);
        }

        // Update USD Wallet
        const usdWalletUpdateFilter: Record<string, unknown> = {
            _id: userWalletDetails._id,
            wallets_details: {
                $elemMatch: {
                    wallet_type: "FIAT",
                    wallet_currency: "USD",
                    wallet_status: "ACTIVE",
                    account_balance: usdWallet.account_balance,
                    available_balance: usdWallet.available_balance,
                    holding_amount: usdWallet.holding_amount,
                },
            },
        };

        const usdWalletUpdate: Record<string, unknown> = {
            $set: {
                [`wallets_details.${usdWalletIndex}.account_balance`]: mongoose.Types.Decimal128.fromString(newUsdAccountBalance.toFixed(4)),
                [`wallets_details.${usdWalletIndex}.available_balance`]: mongoose.Types.Decimal128.fromString(newUsdAvailableBalance.toFixed(4)),
                [`wallets_details.${usdWalletIndex}.holding_amount`]: mongoose.Types.Decimal128.fromString(newUsdHoldingAmount.toFixed(4)),
            },
        };

        // Daily debit
        const usdExistingDailyDate = usdWallet.daily_transaction?.date;
        const usdSameDailyDate = usdExistingDailyDate && usdExistingDailyDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
        if (usdSameDailyDate) {
            usdWalletUpdate.$inc = {
                [`wallets_details.${usdWalletIndex}.daily_transaction.debit`]: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
            };
        } else {
            usdWalletUpdate.$set = {
                ...(usdWalletUpdate.$set as Record<string, unknown>),
                [`wallets_details.${usdWalletIndex}.daily_transaction.debit`]: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
                [`wallets_details.${usdWalletIndex}.daily_transaction.date`]: now,
            };
        }

        // Monthly debit
        const usdExistingMonthlyMonth = usdWallet.monthly_transaction?.month;
        const usdExistingMonthlyYear = usdWallet.monthly_transaction?.year;
        if (usdExistingMonthlyMonth === currentMonth && usdExistingMonthlyYear === currentYear) {
            usdWalletUpdate.$inc = {
                ...(usdWalletUpdate.$inc as Record<string, unknown>),
                [`wallets_details.${usdWalletIndex}.monthly_transaction.debit`]: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
            };
        } else {
            usdWalletUpdate.$set = {
                ...(usdWalletUpdate.$set as Record<string, unknown>),
                [`wallets_details.${usdWalletIndex}.monthly_transaction.debit`]: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
                [`wallets_details.${usdWalletIndex}.monthly_transaction.month`]: currentMonth,
                [`wallets_details.${usdWalletIndex}.monthly_transaction.year`]: currentYear,
            };
        }

        // Yearly debit
        const usdExistingYear = usdWallet.yearly_transaction?.year;
        if (usdExistingYear === currentYear) {
            usdWalletUpdate.$inc = {
                ...(usdWalletUpdate.$inc as Record<string, unknown>),
                [`wallets_details.${usdWalletIndex}.yearly_transaction.debit`]: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
            };
        } else {
            usdWalletUpdate.$set = {
                ...(usdWalletUpdate.$set as Record<string, unknown>),
                [`wallets_details.${usdWalletIndex}.yearly_transaction.debit`]: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
                [`wallets_details.${usdWalletIndex}.yearly_transaction.year`]: currentYear,
            };
        }

        const usdWalletUpdateResult = await user_wallet_details.updateOne(
            usdWalletUpdateFilter,
            usdWalletUpdate,
            {
                session: mongoSession,
            }
        );

        if (usdWalletUpdateResult.modifiedCount !== 1) {
            throw new ServiceError("USD wallet balance changed before crypto payout fee deduction. Please retry.");
        }

        // Create Crypto Wallet Transaction
        const cryptoWalletTransactionId = new Types.ObjectId();
        const cryptoWalletTransaction = {
            cardholder_id: userWalletDetails.cardholder_id,
            wallet_id: userWalletDetails._id,
            transaction_id: cryptoWalletTransactionId,
            transaction_type: "WITHDRAW" as const,
            transaction_status: "SUCCESS" as const,
            wallet_details: {
                wallet_type: "CRYPTO" as const,
                wallet_currency: sourceCurrency,
            },
            amount: mongoose.Types.Decimal128.fromString(
                amount.toFixed(4)
            ),
            fee: mongoose.Types.Decimal128.fromString("0"),
            balance_before: mongoose.Types.Decimal128.fromString(sourceAvailableBalance.toFixed(4)),
            balance_after: mongoose.Types.Decimal128.fromString(newSourceAvailableBalance.toFixed(4)),
            reference_id: transferReferenceId,
            remarks: `Crypto beneficiary transfer to ${destinationAddress} via ${destinationNetwork}`,
        };

        await user_wallet_transactions.create(
            [cryptoWalletTransaction],
            {
                session: mongoSession,
                ordered: true,
            }
        );

        // Create USD Wallet Transaction for Fee Deduction
        const usdFeeWalletTransactionId = new Types.ObjectId();
        const usdFeeWalletTransaction = {
            cardholder_id: userWalletDetails.cardholder_id,
            wallet_id: userWalletDetails._id,
            transaction_id: usdFeeWalletTransactionId,
            transaction_type: "WITHDRAW" as const,
            transaction_status: "SUCCESS" as const,
            wallet_details: {
                wallet_type: "FIAT" as const,
                wallet_currency: "USD" as const,
            },
            amount: mongoose.Types.Decimal128.fromString(
                feeAmountUsd.toFixed(4)
            ),
            fee: mongoose.Types.Decimal128.fromString("0"),
            balance_before:
                mongoose.Types.Decimal128.fromString(
                    usdAvailableBalance.toFixed(4)
                ),

            balance_after:
                mongoose.Types.Decimal128.fromString(
                    newUsdAvailableBalance.toFixed(4)
                ),

            reference_id: transferReferenceId,

            remarks:
                `Crypto payout fee (${feePercentage.toFixed(2)}%) for ${sourceCurrency} transfer`,
        };

        await user_wallet_transactions.create(
            [usdFeeWalletTransaction],
            {
                session: mongoSession,
                ordered: true,
            }
        );

        // Commit Transaction
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            data: {
                transfer_reference_id: transferReferenceId,
                crypto_wallet_transaction_id: cryptoWalletTransactionId.toString(),
                usd_fee_wallet_transaction_id: usdFeeWalletTransactionId.toString(),
                wallet_id: userWalletDetails._id.toString(),
                source_currency: sourceCurrency,
                source_amount: amount.toFixed(4),
                destination_network: destinationNetwork,
                destination_address: destinationAddress,
                source_amount_usd: sourceAmountUsd.toFixed(4),
                fee: {
                    currency: "USD",
                    percentage: feePercentage.toFixed(2),
                    amount: feeAmountUsd.toFixed(4),
                },
                total_source_wallet_debit: {
                    currency: sourceCurrency,
                    amount: amount.toFixed(4),
                },
                total_usd_wallet_debit: {
                    currency: "USD",
                    amount: feeAmountUsd.toFixed(4),
                },
                status: "SUCCESS",
            },
        };

    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, { serviceName: "CreateBeneficiaryTransferTransaction" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError("CreateBeneficiaryTransferTransaction facing issue", sanitizedError);
    }
    finally {
        await mongoSession.endSession();
    }
};

export default createBeneficiaryTransferTransaction;