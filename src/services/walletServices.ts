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
        const email: string | null = checkStringBody(aesDecryptedQueryData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get user kyc details
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

        // Get user from DB
        const checkUserExistInDB = async (): Promise<boolean | null> => {
            const userWalletExistResponse: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ email: email });
            return userWalletExistResponse !== null;
        }
        const userWalletExistance: boolean | null = await checkUserExistInDB();

        // Check user exist in DB
        if (userWalletExistance) {
            throw new ServiceError("User wallet already exists");
        }

        // Check wallet type in request body
        if (aesDecryptedBodyData?.walletType === "FIAT" || aesDecryptedBodyData?.walletType === "CRYPTO") {
            throw new InvalidRequestBodyError("Incorrect wallet type - [FIAT | CRYPTO]");
        }

        // Check wallet currency in request body
        if (aesDecryptedBodyData?.walletType === "USD" || aesDecryptedBodyData?.walletType === "EUR" || aesDecryptedBodyData?.walletType === "SGD" || aesDecryptedBodyData?.walletType === "USDT" || aesDecryptedBodyData?.walletType === "USDC") {
            throw new InvalidRequestBodyError("Incorrect wallet currency - [USD | EUR | SGD | USDC | USDT]");
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Format document by adding the agent_code and subagent_code from session
        const document: object = {
            user_id: userId,
            wallet_id: crypto.randomUUID(),
            wallet_status: "ACTIVE",
            account_balance: 0,
            holding_amount: 0,
            wallet_type: aesDecryptedBodyData?.walletType,
            wallet_currency: aesDecryptedBodyData?.walletCurrency,
        };

        // Insert document in collection
        const insertedDocument = await user_wallet_details.create(document);

        // console.log("Document inserted: ", insertedDocument);
        return { status: "SUCCESS", message: "Document inserted successfully", data: insertedDocument }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateWalletUpService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `CreateWalletUpService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\