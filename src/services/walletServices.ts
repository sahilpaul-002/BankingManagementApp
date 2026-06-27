import type { Request } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, InvalidRequestBodyError, NotFoundError, ServiceError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import checkStringBody from "../utils/checkStringBody.js";
import logger from "../utils/logger.js";
import { Types } from "mongoose";
import type { ParsedQs } from "qs";
import type { userWalletDetailsSchemaTypes, walletDetailsType } from "../types/schemaTypes.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userWalletCreationValidationSchema from "../validations/userWalletCreationValidation.js"
import type { Schema } from "mongoose";
import userLoadWalletTransaction from "../mongoDbTransactions/userLoadWalletTransaction.js";
import userWithdrawWalletTransaction from "../mongoDbTransactions/userWithdrawWalletTransaction.js";
import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";

// ------------------------------------- GET WALLET SERVICE -------------------------------------  \\
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

        const walletDetails = {
            walletId: userWalletDetails?.wallet_id,
            wallets_details: userWalletDetails?.wallets_details
        }

        return { status: "SUCCESS", data: walletDetails || {}, message: "User wallet details fetched" }
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

        // Check wallet details present in request body
        if (!aesDecryptedBodyData?.wallets_details) {
            throw new InvalidRequestBodyError("Wallet details not present in the request body");
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletCreationValidationSchema>> = userWalletCreationValidationSchema.safeParse(aesDecryptedBodyData?.wallets_details);
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

        // New wallet object
        const newWallet: walletDetailsType = {
            wallet_status: "ACTIVE",
            account_balance: validationResult.data.account_balance ?? 0,
            holding_amount: validationResult.data.holding_amount ?? 0,
            wallet_type: validationResult.data.wallet_type,
            wallet_currency: validationResult.data.wallet_currency,
        };

        // Find existing wallet document
        const existingWallet = await user_wallet_details.findOne({ user_id: userId as Schema.Types.ObjectId });

        // Existing user → Add wallet
        if (existingWallet) {
            const duplicate = existingWallet.wallets_details.some(
                (wallet) =>
                    wallet.wallet_currency ===
                    newWallet.wallet_currency
            );

            if (duplicate) {
                throw new ServiceError(`${newWallet.wallet_currency} wallet already exists`);
            }

            existingWallet.wallets_details.push(newWallet);

            await existingWallet.save();

            requestSession.walletId = existingWallet.wallet_id;

            return { status: "SUCCESS", message: "Wallet added successfully", data: { walletId: existingWallet.wallet_id, wallets_details: existingWallet.wallets_details, } };
        }

        // First wallet → Create document
        const insertedDocument: userWalletDetailsSchemaTypes = await user_wallet_details.create({
            user_id: userId as Types.ObjectId,
            wallet_id: crypto.randomUUID(),
            wallets_details: [
                newWallet,
            ],
        });

        requestSession.walletId = insertedDocument.wallet_id;

        return { status: "SUCCESS", message: "Wallet created successfully", data: { walletId: insertedDocument.wallet_id, wallets_details: insertedDocument.wallets_details, } };
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

// ------------------------------------- LOAD WALLET SERVICE -------------------------------------  \\
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

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletActionValidationSchema>> = userWalletActionValidationSchema.safeParse(
            {
                wallet_type: aesDecryptedBodyData.wallet_type,
                wallet_currency: aesDecryptedBodyData.wallet_currency,
                amount: Number(aesDecryptedBodyData.amount),
            }
        );
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

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get wallet details from DB
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId }).lean();

        // Check user exist in DB
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet does not exists");
        }

        // Check wallet authenticity
        if (userWalletDetails?.user_id.toString() !== userId) {
            throw new BadRequestError("Failed to fetch user wallet details - invalid wallet id provided")
        }

        // Find wallet in wallets_details for request currency
        const selectedWallet = userWalletDetails.wallets_details.find((wallet) =>
            wallet.wallet_type === validationResult.data.wallet_type && wallet.wallet_currency === validationResult.data.wallet_currency
        );

        if (!selectedWallet) {
            throw new NotFoundError("Requested wallet does not exist");
        }

        // // Load amount
        // selectedWallet.account_balance = (selectedWallet.account_balance ?? 0) + validationResult.data.amount;

        // await userWalletDetails.save();

        // Load wallet transaction
        const loadWalletTransactionResult = await userLoadWalletTransaction(walletId, validationResult, selectedWallet)

        if (loadWalletTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Load wallet service failed to load wallet")
        }

        return { status: "SUCCESS", message: "Wallet loaded successfully", data: loadWalletTransactionResult?.data }
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

// ------------------------------------- WITHDRAW WALLET SERVICE -------------------------------------  \\
export const withdrawWalletService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
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

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletActionValidationSchema>> = userWalletActionValidationSchema.safeParse(
            {
                wallet_type: aesDecryptedBodyData.wallet_type,
                wallet_currency: aesDecryptedBodyData.wallet_currency,
                amount: Number(aesDecryptedBodyData.amount),
            }
        );
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

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get wallet details from DB
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId }).lean();

        // Check user exist in DB
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet does not exists");
        }

        // Check wallet authenticity
        if (userWalletDetails?.user_id.toString() !== userId) {
            throw new BadRequestError("Failed to fetch user wallet details - invalid wallet id provided")
        }

        // Find wallet in wallets_details for request currency
        const selectedWallet = userWalletDetails.wallets_details.find((wallet) =>
            wallet.wallet_type === validationResult.data.wallet_type && wallet.wallet_currency === validationResult.data.wallet_currency
        );

        if (!selectedWallet) {
            throw new NotFoundError("Requested wallet does not exist");
        }

        // // Load amount
        // selectedWallet.account_balance = (selectedWallet.account_balance ?? 0) + validationResult.data.amount;

        // await userWalletDetails.save();

        // Load wallet transaction
        const withdrawWalletTransactionResult = await userWithdrawWalletTransaction(walletId, validationResult, selectedWallet)

        if (withdrawWalletTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Widthraw wallet service failed to load wallet")
        }

        return { status: "SUCCESS", message: "Wallet withdrawed successfully", data: withdrawWalletTransactionResult?.data }
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