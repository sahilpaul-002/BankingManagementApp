import type { Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
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
import deductFeeSrive from "./deductFeesService.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import getWalletTransactionsValidationSchema from "../validations/getWalletTransactionValidation.js";
import { userDetailsModel as user_details } from "../models/user_details.js";

type userConfigurationsType = {
    businessId: string;
    programId: string;
    agentCode: string;
    subAgentCode: string;
}

// ------------------------------------- GET WALLET SERVICE -------------------------------------  \\
export const getWalletService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }
        const cardholderId = checkStringQueryParams(aesDecryptedQueryData, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("User Id not found in request request body")
        }
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to create wallet")
            }
        }
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
        }

        // Get user wallet details details
        const userWalletDetails = await user_wallet_details.findOne({
            cardholder_id: cardholderId
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
export const createWalletService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Validate Email & User Id & Cardholder Id
        const email = checkStringBody(aesDecryptedBodyData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to create wallet")
        }
        // Validation M2P is allowed
        if (!requestSession?.sessiondata?.m2pAllowed) {
            throw new ServiceError("Wallet access is not allowed for this application - M2P is not allowed.")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }
        const cardholderId = checkStringBody(aesDecryptedBodyData, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("Cardholder-id not found in request request body")
        }
        let userId;
        if (cardholderId === requestSession?.cardholderId) {
            userId = requestSession?.userId;
            if (!userId) {
                throw new UnauthenticatedError("Unauthenticated access detected");
            }
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id.toString();
        }

        // Validation user bank details exist and verified
        // Get user bank details details
        const userBankDetailsDoc = await user_bank_details.findOne({
            user_id: userId
        }).select("_id is_verified").lean();
        if (!userBankDetailsDoc) {
            throw new NotFoundError("User bank details not found");
        }
        if (!userBankDetailsDoc.is_verified) {
            throw new UnauthorizedError("User bank details are not verified");
        }

        // Check wallet details present in request body
        if (!aesDecryptedBodyData?.wallets_details) {
            throw new InvalidRequestBodyError("Wallet details not present in the request body");
        }

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
            account_balance: 0,
            holding_amount: 0,
            wallet_type: validationResult.data.wallet_type,
            wallet_currency: validationResult.data.wallet_currency,
        };

        // Find existing wallet document
        const existingWallet = await user_wallet_details.findOne({ user_id: userId, cardholder_id: cardholderId });

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
            user_id: userId,
            wallet_id: crypto.randomUUID(),
            cardholder_id: cardholderId,
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
export const loadWalletService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, any> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check Wallet Details
        const walletDetails = aesDecryptedBodyData?.walletDetails
        if (!walletDetails) {
            throw new InvalidRequestBodyError("Wallet details not present in the request body")
        }

        // Validate Email & Wallet Id & Cardholder Id
        const email = checkStringBody(aesDecryptedBodyData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to load wallet")
        }
        // Validation M2P is allowed
        if (!requestSession?.sessiondata?.m2pAllowed) {
            throw new ServiceError("Wallet access is not allowed for this application - M2P is not allowed.")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }
        const cardholderId = checkStringBody(walletDetails, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("Cardholder-id not found in request request body")
        }
        // Check email present in request body
        const walletId: string | null = checkStringBody(walletDetails, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        let userId;
        if (cardholderId === requestSession?.cardholderId) {
            userId = requestSession?.userId;
            if (!userId) {
                throw new UnauthenticatedError("Unauthenticated access detected");
            }
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id.toString();
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletActionValidationSchema>> = userWalletActionValidationSchema.safeParse(
            {
                wallet_type: walletDetails?.wallet_type,
                wallet_currency: walletDetails?.wallet_currency,
                amount: Number(walletDetails?.amount),
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

        // Get wallet details from DB
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId, cardholder_id: cardholderId }).lean();

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

        const finalAmount: number = deductFeeSrive(validationResult.data.amount, validationResult.data.wallet_type === "FIAT" ? "load_fiat_wallet_percent" : "load_crypto_wallet_percent");
        validationResult.data.amount = finalAmount
        // Load wallet transaction
        const loadWalletTransactionResult = await userLoadWalletTransaction(cardholderId, walletId, validationResult, selectedWallet)

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
export const withdrawWalletService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, any> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check Wallet Details
        const walletDetails = aesDecryptedBodyData?.walletDetails
        if (!walletDetails) {
            throw new InvalidRequestBodyError("Wallet details not present in the request body")
        }

        // Validate Email & Wallet Id & Cardholder Id
        const email = checkStringBody(aesDecryptedBodyData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to withdraw amount form wallet")
        }
        // Validation M2P is allowed
        if (!requestSession?.sessiondata?.m2pAllowed) {
            throw new ServiceError("Wallet access is not allowed for this application - M2P is not allowed.")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }
        const cardholderId = checkStringBody(walletDetails, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("Cardholder-id not found in request request body")
        }
        // Check email present in request body
        const walletId: string | null = checkStringBody(walletDetails, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        let userId;
        if (cardholderId === requestSession?.cardholderId) {
            userId = requestSession?.userId;
            if (!userId) {
                throw new UnauthenticatedError("Unauthenticated access detected");
            }
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id.toString();
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userWalletActionValidationSchema>> = userWalletActionValidationSchema.safeParse(
            {
                wallet_type: walletDetails?.wallet_type,
                wallet_currency: walletDetails?.wallet_currency,
                amount: Number(walletDetails?.amount),
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

        // Get wallet details from DB
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId, cardholder_id: cardholderId }).lean();

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

        // Load wallet transaction
        const withdrawWalletTransactionResult = await userWithdrawWalletTransaction(cardholderId, walletId, validationResult, selectedWallet)

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

// ----------------------------------- GET WALLET TRANSACTIONS ----------------------------------- \\
export const getWalletTransactionsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_transactions");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate Email & Wallet Id
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }
        const cardholderId = checkStringQueryParams(aesDecryptedQueryData, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("Cardholder-id not found in request request body")
        }
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to create wallet")
            }
        }
        const walletId: string | null = checkStringQueryParams(aesDecryptedQueryData, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        let userId;
        if (cardholderId === requestSession?.cardholderId) {
            userId = requestSession?.userId;
            if (!userId) {
                throw new UnauthenticatedError("Unauthenticated access detected");
            }
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id.toString();
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof getWalletTransactionsValidationSchema>> = getWalletTransactionsValidationSchema.safeParse(aesDecryptedQueryData);
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

        // Verify wallet
        const wallet: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId, cardholder_id: cardholderId }).lean();

        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }

        // Date range filter
        const dateFilter: Record<string, Date> = {};
        let fromDate: string | null;
        let toDate: string | null;

        if (aesDecryptedQueryData.from_date) {
            fromDate = checkStringQueryParams(aesDecryptedQueryData, "from_date");
            if (!fromDate) {
                throw new InvalidRequestQueryError("From date parameter is not present");
            }
            dateFilter.$gte = new Date(fromDate);
        }

        if (aesDecryptedQueryData.to_date) {
            toDate = checkStringQueryParams(aesDecryptedQueryData, "to_date");
            if (!toDate) {
                throw new InvalidRequestQueryError("To date parameter is not present");
            }

            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);

            dateFilter.$lte = endDate;
        }

        // Get page in request
        const requestedPage = validationResult?.data?.page;
        // Get page size in request
        const pageSize = validationResult?.data?.page_size;

        // Query filters
        const query = {
            wallet_id: walletId,
            ...(validationResult?.data?.wallet_type && { "wallet_details.wallet_type": validationResult?.data?.wallet_type }),
            ...(validationResult?.data?.wallet_currency && { "wallet_details.wallet_currency": validationResult?.data?.wallet_currency }),
            ...(validationResult?.data?.transaction_type && { transaction_type: validationResult?.data?.transaction_type }),
            ...(validationResult?.data?.transaction_status && { transaction_status: validationResult?.data?.transaction_status }),
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        };

        // Get total matching transactions
        const totalTransactions = await user_wallet_transactions.countDocuments(query);
        // Calculate total pages
        const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));
        // Calculate current page
        const currentPage = Math.min(requestedPage, totalPages);
        // Calculate skip using the corrected page
        const skip = (currentPage - 1) * pageSize; // Skip fetching documents for page number more than 1

        // Query Selects
        const querySelect = {
            transaction_id: 1,
            transaction_type: 1,
            transaction_status: 1,
            amount: 1,
            balance_after: 1,
            createdAt: 1,
            ...(
                !aesDecryptedQueryData.wallet_type &&
                !aesDecryptedQueryData.wallet_currency && {
                    wallet_details: 1,
                }
            ),
        };

        // Fetch transactions
        const transactions = await user_wallet_transactions.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).select(querySelect).lean();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            throw new NotFoundError("Wallet transactions not found")
        }

        return {
            status: "SUCCESS",
            message: "Wallet transactions fetched successfully",
            data: {
                walletId,
                pagination: {
                    current_page: currentPage,
                    page_size: pageSize,
                    total_records: totalTransactions,
                    total_pages: Math.ceil(totalTransactions / pageSize),
                    has_next_page: currentPage * pageSize < totalTransactions,
                    has_previous_page: currentPage > 1,
                },
                transactions,
            },
        };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetWalletTransactionService" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetWalletTransactionService facing issue: ${error.message}`, error);
    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


// ----------------------------------- GET WALLET TRANSACTION DETAILS ----------------------------------- \\
export const getWalletTransactionDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType, transactionId?: string): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_transactions");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate transaction id
        if (!transactionId) {
            throw new InvalidRequestQueryError("Transaction id not provided");
        }

        // Validate Email & Wallet Id
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }
        const cardholderId = checkStringQueryParams(aesDecryptedQueryData, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("Cardholder-id not found in request request body")
        }
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to create wallet")
            }
        }
        const walletId: string | null = checkStringQueryParams(aesDecryptedQueryData, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        let userId;
        if (cardholderId === requestSession?.cardholderId) {
            userId = requestSession?.userId;
            if (!userId) {
                throw new UnauthenticatedError("Unauthenticated access detected");
            }
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id.toString();
        }

        // Verify wallet
        const wallet: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ wallet_id: walletId, cardholder_id: cardholderId }).lean();

        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }

        // Get Wallet Transaction Details
        const transaction = await user_wallet_transactions.findOne({
            wallet_id: walletId,
            transaction_id: transactionId,
        }).select("transaction_id transaction_type transaction_status wallet_details amount balance_after createdAt").lean();

        if (!transaction) {
            throw new NotFoundError("Wallet transactions not found")
        }

        return { status: "SUCCESS", message: "Wallet transaction fetched successfully", data: { walletId, transaction } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetWalletTransactionDetailsService" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetWalletTransactionDetailsService facing issue: ${error.message}`, error);
    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 