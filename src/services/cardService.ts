import type { Request } from "express";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userCardDetailsModel as user_card_details } from "../models/user_card_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, InvalidRequestBodyError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthorizedError } from "../utils/AppErrorClass.js";
import type { userCardDetailsSchemaTypes, userDetailsSchemaTypes, userWalletDetailsSchemaTypes, walletDetailsType, } from "../types/schemaTypes.js";
import type { successResponseJson } from "../types/responseJson.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { ParsedQs } from "qs";
import checkStringBody from "../utils/checkStringBody.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import userCardCreationValidation from "../validations/userCardCreationValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import type { Schema } from "mongoose";
import userCreateCardTransaction from "../mongoDbTransactions/userCreateCardTransaction.js";

// ----------------------------------- GET WALLET TRANSACTIONS ----------------------------------- \\
export const createCardService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_transactions");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate session cardholderId
        if (!requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - cardholderId not found in session");
        }

        // Wallet id
        const cardholderId = checkStringBody(aesDecryptedBodyData, "cardholder_id");

        // Validate cardholderId
        if (cardholderId !== requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided")
        }

        const userId = requestSession?.userId;

        // Verify cardholder id
        const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ cardholder_id: cardholderId }).select("_id").lean();
        if (!userDetailsDoc || (userDetailsDoc?._id.toString() !== userId)) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided");
        }

        // Validate user usd wallet existance
        const userUsdWalletDetailsDoc = await user_wallet_details.findOne(
            {
                user_id: userId,
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
            }
        ).lean();
        if (!userUsdWalletDetailsDoc?.wallets_details?.length || !userUsdWalletDetailsDoc?.wallets_details?.[0]) {
            throw new NotFoundError("User USD wallet not found");
        }
        const userUsdWallet: walletDetailsType = userUsdWalletDetailsDoc.wallets_details[0];

        // Check usd wallet amount
        if ((userUsdWallet?.account_balance ?? 0) <= 5) {
            throw new BadRequestError(
                "Issuficient balance in USD wallet"
            );
        }


        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userCardCreationValidation>> = userCardCreationValidation.safeParse(aesDecryptedBodyData);
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

        const walletId = userUsdWalletDetailsDoc?.wallet_id

        // Create card transaction
        const cardCreationTransactionResult = await userCreateCardTransaction(userId, userUsdWallet, cardholderId, validationResult, walletId)

        if (cardCreationTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Create card service is facing - failed to create user card")
        }

        const cardDetails = {
            cardholderId: cardCreationTransactionResult?.data?.cardholder_id,
            cardId: cardCreationTransactionResult?.data?.card_id,
            cardNumber: cardCreationTransactionResult?.data?.card_number,
            nameOnCard: cardCreationTransactionResult?.data?.name_on_card,
            cardStatus: cardCreationTransactionResult?.data?.card_status,
            cardLimits: cardCreationTransactionResult?.data?.card_limits,
            issueDate: cardCreationTransactionResult?.data?.issued_date,
            validDate: cardCreationTransactionResult?.data?.valid_date,
            cardType: cardCreationTransactionResult?.data?.card_type,
            cardCurrency: cardCreationTransactionResult?.data?.card_currency,
        };

        return { status: "SUCCESS", message: "Wallet transactions fetched successfully", data: cardDetails };

    }

    catch (err) {

        const error =
            err as any;

        logger.error(
            error,
            {
                serviceName:
                    "GetWalletTransactionService",
            }
        );

        if (
            error instanceof
            AppErrorClass
        ) {
            throw error;
        }

        throw new ServiceError(
            `GetWalletTransactionService facing issue: ${error.message
            }`,
            error
        );

    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 