import mongoose, { Types } from "mongoose";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, NotFoundError, ServiceError } from "../utils/AppErrorClass.js";
import type { walletDetailsType } from "../types/schemaTypes.js";
import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";
import z from "zod";
import type { SafeParseSuccess } from "zod/v3";
import userWalletTransactionsValidationSchema from "../validations/userWalletTransactionsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import { config } from "dotenv";
import { FEE_DETAILS, MERCHANT_CATEGORIES } from "../configs/configConstants.js";
import crypto from "crypto"
import { userCardDetailsModel as user_card_details } from "../models/user_card_details.js";
import userCardCreationValidationSchema from "../validations/userCardCreationValidation.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import { Decimal } from "decimal.js"

const generateCardNumber = (): string => {
    const prefixes = ["4", "2", "5"];

    const firstDigit =
        prefixes[
        crypto.randomInt(
            0,
            prefixes.length
        )
        ];

    const remainingDigits =
        Array.from(
            { length: 15 },
            () => crypto.randomInt(0, 10)
        ).join("");

    return firstDigit + remainingDigits;
};

type userCardDataValidationType = SafeParseSuccess<z.infer<typeof userCardCreationValidationSchema>>;

const userCreateCardTransaction = async (cardholderObjectId: Types.ObjectId, userCardData: userCardDataValidationType) => {
    // Start transaction
    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Check collection
        const isCollectionPresent1 = await checkMongoDbCollectionExist("user_wallet_transactions");
        if (isCollectionPresent1.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(wallet transaction) does not exist");
        }

        // Check collection
        const isCollectionPresent2 = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent2.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Validate user usd wallet existance
        const userUsdWalletDetailsDoc = await user_wallet_details.findOne(
            {
                cardholder_id: cardholderObjectId,
                "wallets_details.wallet_currency": "USD"
            },
            {
                wallet_id: 1,
                user_id: 1,
                wallets_details: {
                    $elemMatch: {
                        wallet_currency: "USD"
                    }
                }
            },
            {
                session: mongoSession
            }
        ).lean();
        if (!userUsdWalletDetailsDoc?.wallets_details?.length || !userUsdWalletDetailsDoc?.wallets_details?.[0]) {
            throw new NotFoundError("User USD wallet not found");
        }
        const userUsdWallet: walletDetailsType = userUsdWalletDetailsDoc.wallets_details[0];

        // Check USD wallet
        const walletObjectId = userUsdWalletDetailsDoc?._id;
        if (!userUsdWallet) {
            throw new NotFoundError("User USD wallet not found");
        }
        // Check account balance exists
        if (userUsdWallet.account_balance == null) {
            throw new ServiceError("USD wallet account balance not found");
        }
        // Check available balance exists
        if (userUsdWallet.available_balance == null) {
            throw new ServiceError("USD wallet available balance not found");
        }
        // Check holding amount exists
        if (userUsdWallet.holding_amount == null) {
            throw new ServiceError("USD wallet holding amount not found");
        }
        // Card creation fee
        const feeAmount = new Decimal(FEE_DETAILS.create_card.toString());
        // Convert wallet balances to Decimal
        const accountBalance = new Decimal(userUsdWallet.account_balance.toString());
        const availableBalance = new Decimal(userUsdWallet.available_balance.toString());
        const holdingAmount = new Decimal(userUsdWallet.holding_amount.toString());

        // Balance Check
        if (availableBalance.lessThan(feeAmount)) {
            throw new ServiceError("Insufficient available balance in USD wallet");
        }

        // Calculate Balances
        const accountBalanceBefore = accountBalance;
        const accountBalanceAfter = accountBalance.minus(feeAmount);

        const availableBalanceBefore = availableBalance;
        const availableBalanceAfter = availableBalance.minus(feeAmount);

        const holdingAmountBefore = holdingAmount;
        const holdingAmountAfter = holdingAmount;

        // Verify Wallet SAccounting
        if (!accountBalance.equals(availableBalance.plus(holdingAmount))) {
            throw new ServiceError("Wallet balance inconsistency detected before card creation");
        }
        if (!accountBalanceAfter.equals(availableBalanceAfter.plus(holdingAmountAfter))) {
            throw new ServiceError("Wallet balance inconsistency detected after card creation");
        }

        // Deduct wallet balance
        const feeAmountString = feeAmount.toDecimalPlaces(4).toString();
        const feeAmountDecimal = mongoose.Types.Decimal128.fromString(feeAmountString);
        const negativeFeeAmountDecimal = mongoose.Types.Decimal128.fromString(`-${feeAmountString}`);

        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                cardholder_id: cardholderObjectId,
                "wallets_details.wallet_currency": "USD",
                "wallets_details.account_balance": {
                    $gte: feeAmountDecimal,
                },
                "wallets_details.available_balance": {
                    $gte: feeAmountDecimal,
                },
            },
            {
                $inc: {
                    "wallets_details.$.account_balance": negativeFeeAmountDecimal,
                    "wallets_details.$.available_balance": negativeFeeAmountDecimal,
                },
            },
            {
                new: true,
                session: mongoSession,
            }
        );

        if (!updatedWallet) {
            throw new BadRequestError("Insufficient balance in USD wallet");
        }

        // Generate card details
        const cardNumber = generateCardNumber();
        const cvv = crypto.randomInt(100, 1000).toString();

        const issuedDate = new Date();

        const validDate = new Date();
        validDate.setFullYear(validDate.getFullYear() + 5);


        // Validate card limits
        const cardLimits = userCardData.data.card_limits;
        let cardLimitsData;
        if (cardLimits) {
            if (cardLimits.daily_limit === undefined || cardLimits.monthly_limit === undefined || cardLimits.yearly_limit === undefined) {
                throw new ServiceError("Daily, monthly and yearly card limits are required");
            }
            cardLimitsData = {
                daily_limit: mongoose.Types.Decimal128.fromString(new Decimal(cardLimits.daily_limit).toDecimalPlaces(4).toString()),
                monthly_limit: mongoose.Types.Decimal128.fromString(new Decimal(cardLimits.monthly_limit).toDecimalPlaces(4).toString()),
                yearly_limit: mongoose.Types.Decimal128.fromString(new Decimal(cardLimits.yearly_limit).toDecimalPlaces(4).toString()),
            };
        }

        // Create card
        const createdCard = await user_card_details.create(
            [
                {
                    cardholder_id: cardholderObjectId,
                    card_number: cardNumber,
                    card_status: "INACTIVE",
                    cvv,
                    issued_date: issuedDate,
                    valid_date: validDate,
                    name_on_card: userCardData.data.name_on_card,
                    card_type: userCardData.data.card_type,
                    card_currency: userCardData.data.card_currency,

                    ...(cardLimitsData && {
                        card_limits: cardLimitsData,
                    }),

                    ...(userCardData.data.merchant_categories && {
                        valid_merchant_categories: [
                            ...userCardData.data.merchant_categories
                        ],
                    }),
                }
            ],
            {
                session: mongoSession
            }
        );

        // Prepare transaction payload
        const transactionPayload = {
            transaction_type: "WITHDRAW",
            transaction_status: "SUCCESS",
            wallet_details: {
                wallet_type: userUsdWallet?.wallet_type,
                wallet_currency: "USD"
            },
            amount: feeAmount,
            fee: new Decimal("0"),
            balance_before: accountBalanceBefore,
            balance_after: accountBalanceAfter,
            reference_id: crypto.randomUUID(),
            remarks: "Card creation fee",
        };

        // Check Transaction Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletTransactionsValidationSchema>> = userWalletTransactionsValidationSchema.safeParse(transactionPayload);
        if (!validationResult.success) {
            // return res.status(400).json({
            //     status: "SERVICE_ERROR",
            //     message: "Invalid request body",
            //     // errors: validationResult.error.issues.map(issue => issue.message)
            //     // errors: validationResult.error.issues.map(issue => ({
            //     //     [issue.path.join(".")]: issue.message
            //     // }))
            //     errors: z.flattenError(validationResult.error)
            // });
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Transaction entry
        await user_wallet_transactions.create(
            [
                {
                    cardholder_id: cardholderObjectId,
                    wallet_id: walletObjectId,
                    transaction_id: new Types.ObjectId(),
                    transaction_type: validationResult.data.transaction_type,
                    transaction_status: validationResult.data.transaction_status,
                    wallet_details: {
                        wallet_type: validationResult.data.wallet_details.wallet_type,
                        wallet_currency: validationResult.data.wallet_details.wallet_currency,
                    },

                    amount: mongoose.Types.Decimal128.fromString(feeAmount.toFixed(4)),
                    fee: mongoose.Types.Decimal128.fromString(validationResult.data.fee.toFixed(4)),
                    balance_before: mongoose.Types.Decimal128.fromString(accountBalanceBefore.toFixed(4)),
                    balance_after: mongoose.Types.Decimal128.fromString(accountBalanceAfter.toFixed(4)),
                    reference_id: validationResult.data.reference_id,
                    remarks: "Card creation wallet withdrawal transaction",
                },
            ],
            {
                session: mongoSession,
            }
        );

        await mongoSession.commitTransaction();

        return { status: "SUCCESS", message: "Card created successfully", data: createdCard[0]?.toObject() };

    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateCardTransactionService",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(`CreateCardTransactionService facing issue`, sanitizedError);

    }
    finally {
        await mongoSession.endSession();
    }
}

export default userCreateCardTransaction;