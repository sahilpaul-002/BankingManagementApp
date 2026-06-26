import type { Request } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, InvalidRequestBodyError, NotFoundError, ServiceError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import checkStringBody from "../utils/checkStringBody.js";
import logger from "../utils/logger.js";
import type { Schema } from "mongoose";
import type { ParsedQs } from "qs";
import type { userWalletDetailsSchemaTypes } from "../types/schemaTypes.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userWalletCreationValidationSchema from "../validations/userWalletCreationValidation.js"

// ------------------------------------- CREATE WALLET SERVICE -------------------------------------  \\
export const getWalletService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringQueryParams(aesDecryptedQueryData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check request body email with session email
        if (requestSession?.userEmail !== email) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get user wallet details details
        const userWalletDetails = await user_wallet_details.findOne({
            user_id: userId as Schema.Types.ObjectId
        });
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet details not found")
        }

        return { status: "SUCCESS", data: userWalletDetails || {}, message: "User wallet details fetched" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetWalletService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(
            `GetWalletService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- CREATE WALLET SERVICE -------------------------------------  \\
export const createWalletService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check request body email with session email
        if (requestSession?.userEmail !== email) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get wallet details from DB
        const checkUserWalletExistInDB = async (): Promise<boolean | null> => {
            const userWalletExistResponse: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ user_id: userId as Schema.Types.ObjectId });
            return userWalletExistResponse !== null;
        }
        const userWalletExistance: boolean | null = await checkUserWalletExistInDB();

        // Check user exist in DB
        if (userWalletExistance) {
            throw new ServiceError("User wallet already exists");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletCreationValidationSchema>> = userWalletCreationValidationSchema.safeParse(aesDecryptedBodyData);
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

        // Format document by adding the agent_code and subagent_code from session
        const document: object = {
            user_id: userId as Schema.Types.ObjectId,
            wallet_id: crypto.randomUUID(),
            wallet_status: "ACTIVE",
            account_balance: 0,
            holding_amount: 0,
            wallet_type: validationResult?.data?.wallet_type,
            wallet_currency: validationResult?.data?.wallet_currency,
        };

        // Insert document in collection
        const insertedDocument = await user_wallet_details.create(document);
        const walletDetails = {
            walletId: insertedDocument?.wallet_id,
            wallets_details: {
                walletStatus: insertedDocument?.wallets_details?.wallet_status,
                accountBalance: insertedDocument?.wallets_details?.account_balance,
                holdingAmount: insertedDocument?.wallets_details?.holding_amount,
                walletType: insertedDocument?.wallets_details?.wallet_type,
                walletCurrency: insertedDocument?.wallets_details?.wallet_currency
            }
        }

        // console.log("Document inserted: ", insertedDocument);
        return { status: "SUCCESS", message: "Document inserted successfully", data: walletDetails }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateWalletService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `CreateWalletService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- CREATE WALLET SERVICE -------------------------------------  \\
export const loadWalletService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const walletId: string | null = checkStringBody(aesDecryptedBodyData, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }

        // Check amount present in request body
        if (!aesDecryptedBodyData?.amount || typeof aesDecryptedBodyData.amount !== "number") {
            throw new InvalidRequestBodyError("Amount not present in the request body or not a number");
        }
        if (aesDecryptedBodyData?.amount <= 0) {
            throw new InvalidRequestBodyError("Invalid amount provided - ammount cannot be 0 or negative");
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get wallet details from DB
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId });

        // Check user exist in DB
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet does not exists");
        }

        // Check wallet authenticity
        if (userWalletDetails?.user_id !== userId) {
            throw new BadRequestError("Failed to fetch user wallet details - invalid wallet id provided")
        }

        // Deposit amount in wallet
        const updatedWallet = await user_wallet_details.findOneAndUpdate(
            { user_id: userId },
            {
                $inc: {
                    account_balance: aesDecryptedBodyData?.amount
                }
            },
            { new: true }
        );

        const walletDetails = {
            walletId: updatedWallet?.wallet_id,
            wallets_details: {
                walletStatus: updatedWallet?.wallets_details?.wallet_status,
                accountBalance: updatedWallet?.wallets_details?.account_balance,
                holdingAmount: updatedWallet?.wallets_details?.holding_amount,
                walletType: updatedWallet?.wallets_details?.wallet_type,
                walletCurrency: updatedWallet?.wallets_details?.wallet_currency
            }
        }

        return { status: "SUCCESS", message: "Document inserted successfully", data: walletDetails }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "LoadWalletService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `LoadWalletService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\