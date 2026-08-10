import mongoose from "mongoose";
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

const userCreateCardTransaction = async (userUsdWalletDetails: walletDetailsType, cardholderId: string, userCardData: userCardDataValidationType, walletId?: string) => {
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

        const deductionAmount = FEE_DETAILS.create_card;

        const balanceBefore = Number(userUsdWalletDetails?.account_balance?.toString()) ?? 0;
        const balanceAfter = balanceBefore - deductionAmount;

        // Deduct wallet balance
        const deductionAmountDecimal = mongoose.Types.Decimal128.fromString(deductionAmount.toString());
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            {
                cardholder_id: cardholderId,
                "wallets_details.wallet_currency": "USD",
                "wallets_details.account_balance": {$gte: deductionAmountDecimal,},
            },
            {
                $inc: {
                    "wallets_details.$.account_balance": -deductionAmount
                }
            },
            {
                new: true,
                session: mongoSession
            }
        );

        if (!updatedWallet) {
            throw new BadRequestError("Insufficient balance in USD wallet");
        }

        // Generate card details
        const cardId = crypto.randomUUID();
        const cardNumber = generateCardNumber();
        const cvv = crypto.randomInt(100, 1000).toString();

        const issuedDate = new Date();

        const validDate = new Date();
        validDate.setFullYear(validDate.getFullYear() + 5);

        const cardLimits = userCardData.data?.card_limits
        let dailyLimit: string
        let monthlyLimit: string
        let yearlyLimit: string
        if (cardLimits) {
            dailyLimit = cardLimits?.daily_limit as string;
            monthlyLimit = cardLimits?.monthly_limit as string;
            yearlyLimit = cardLimits?.yearly_limit as string;
        }

        // Create card
        const createdCard = await user_card_details.create(
            [
                {
                    cardholder_id: cardholderId as string,
                    card_id: cardId,
                    card_number: cardNumber,
                    card_status: "INACTIVE",
                    cvv,
                    issued_date: issuedDate,
                    valid_date: validDate,
                    name_on_card: userCardData.data?.name_on_card,
                    card_type: userCardData.data?.card_type,
                    card_currency: userCardData.data?.card_currency,
                    ...(userCardData.data.card_limits && {
                        card_limits: {
                            daily_limit: dailyLimit!, monthly_limit: monthlyLimit!, yearly_limit: yearlyLimit!
                        }
                    }),
                    ...(userCardData.data.merchant_categories && {
                        valid_merchant_categories: [...(userCardData.data.merchant_categories ?? MERCHANT_CATEGORIES)],
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
                wallet_type: userUsdWalletDetails?.wallet_type,
                wallet_currency: "USD"
            },
            amount: deductionAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
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
                    wallet_id: walletId,
                    transaction_id: crypto.randomUUID(),
                    transaction_type: validationResult?.data?.transaction_type,
                    transaction_status: validationResult?.data?.transaction_status,
                    wallet_details: {
                        wallet_type: validationResult?.data?.wallet_details?.wallet_type,
                        wallet_currency: validationResult?.data?.wallet_details?.wallet_currency,
                    },
                    amount: validationResult.data.amount,
                    balance_before: validationResult?.data?.balance_before,
                    balance_after: validationResult?.data?.balance_after,
                    reference_id: validationResult?.data?.reference_id,
                    remarks: validationResult?.data?.remarks,
                }
            ] as any,
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

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `CreateCardTransactionService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );

    }
    finally {
        await mongoSession.endSession();
    }
}

export default userCreateCardTransaction;