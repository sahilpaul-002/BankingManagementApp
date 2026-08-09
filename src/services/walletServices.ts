import type { Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import checkStringBody from "../utils/checkStringBody.js";
import logger from "../utils/logger.js";
import mongoose, { Types } from "mongoose";
import type { ParsedQs } from "qs";
import type { userWalletDetailsSchemaTypes, walletDetailsType } from "../types/schemaTypes.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userWalletCreationValidationSchema from "../validations/userWalletCreationValidation.js"
import userLoadWalletTransaction from "../mongoDbTransactions/userLoadWalletTransaction.js";
import userWithdrawWalletTransaction from "../mongoDbTransactions/userWithdrawWalletTransaction.js";
import userWalletActionValidationSchema from "../validations/userWalletActionValidation.js";
import deductFeeSrive from "./deductFeesService.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import getWalletTransactionsValidationSchema from "../validations/getWalletTransactionValidation.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { Decimal } from "decimal.js";
import walletCurrencyConversionValidationSchema from "../validations/walletCurrencyConversionValidation.js";
import { FEE_DETAILS } from "../configs/configConstants.js";
import { walletCurrencyConversionQuoteModel as wallet_currency_conversion_quote } from "../models/wallet_currency_conversion_quote.js";
import getWalletFxRate from "./walletFxRateService.js";
import executeWalletCurrencyConversionTransaction from "../mongoDbTransactions/walletCurrencyConversionTransaction.js";

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
            throw new ForbiddenError("User configuration is not valid to access wallet details")
        }
        const cardholderId = checkStringQueryParams(aesDecryptedQueryData, "cardholder_id");
        if (!cardholderId) {
            throw new InvalidRequestBodyError("User Id not found in request request body")
        }
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to access wallet details")
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
            throw new ForbiddenError("User configuration is not valid to create wallet")
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
            account_balance: mongoose.Types.Decimal128.fromString("0"),
            holding_amount: mongoose.Types.Decimal128.fromString("0"),
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
            throw new ForbiddenError("User configuration is not valid to load wallet")
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

        const finalAmount: Decimal = deductFeeSrive(new Decimal(validationResult.data.amount), validationResult.data.wallet_type === "FIAT" ? "load_fiat_wallet_percent" : "load_crypto_wallet_percent");
        validationResult.data.amount = Number(finalAmount)
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
            throw new ForbiddenError("User configuration is not valid to withdraw amount from wallet")
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
            throw new ForbiddenError("User configuration is not valid to access wallet transactions")
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
            throw new ForbiddenError("User configuration is not valid to access wallet transaction details")
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



// ------------------------------------- CREATE WALLET CURRENCY CONVERSION QUOTE ------------------------------------- //
export const createWalletCurrencyConversionQuoteService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, string> | undefined,
    userConfiguration: userConfigurationsType): Promise<any> => {

    try {

        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }


        // --------------------------------------------------
        // Check collection
        // --------------------------------------------------

        const isCollectionPresent =
            await checkMongoDbCollectionExist(
                "wallet_currency_conversion_quotes"
            );

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError(
                "Currency conversion quotes collection does not exist in MongoDB"
            );
        }


        // --------------------------------------------------
        // Validate email
        // --------------------------------------------------

        const email = checkStringQueryParams(
            aesDecryptedQueryData,
            "email"
        );

        if (!email) {
            throw new InvalidRequestBodyError(
                "Email not found in request query"
            );
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError(
                "Unauthorized access detected - invalid email"
            );
        }


        // --------------------------------------------------
        // Validate user type
        // --------------------------------------------------

        if (
            requestSession?.userType !== "ADMIN" &&
            requestSession?.userType !== "MASTER_ADMIN"
        ) {
            throw new ForbiddenError(
                "Not authorized to create currency conversion quote"
            );
        }


        // --------------------------------------------------
        // Validate configuration
        // --------------------------------------------------

        const sessionBusinessId =
            requestSession?.userConfiguration?.businessId;

        const sessionProgramId =
            requestSession?.userConfiguration?.programId;

        const sessionAgentCode =
            requestSession?.userConfiguration?.agentCode;

        const sessionSubAgentCode =
            requestSession?.userConfiguration?.subAgentCode;


        if (
            userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError(
                "User configuration is not valid to create currency conversion quote"
            );
        }


        // --------------------------------------------------
        // Validate request body
        // --------------------------------------------------

        const validationResult = walletCurrencyConversionValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            throw new ServiceError(
                "Invalid request",
                z.flattenError(validationResult.error)
            );
        }

        const validatedData = validationResult.data;


        // --------------------------------------------------
        // Get user ID
        // --------------------------------------------------

        const userId = requestSession?.userId;

        if (!userId) {
            throw new UnauthorizedError(
                "Unauthorized session detected - user id not found in session"
            );
        }


        // --------------------------------------------------
        // Get wallet details
        // --------------------------------------------------

        const userWalletDetails =
            await user_wallet_details.findOne(
                {
                    user_id: userId,
                    cardholder_id: validatedData.cardholder_id,
                },
                {
                    wallet_id: 1,
                    cardholder_id: 1,
                    wallets_details: 1,
                }
            ).lean();


        if (!userWalletDetails) {
            throw new NotFoundError(
                "User wallet details not found"
            );
        }


        // --------------------------------------------------
        // Find source wallet
        // --------------------------------------------------
        const sourceWallet = userWalletDetails.wallets_details.find(
            (wallet) =>
                wallet.wallet_currency ===
                validatedData.source_wallet_currency &&
                wallet.wallet_status === "ACTIVE"
        );


        if (!sourceWallet) {
            throw new NotFoundError(
                `Active ${validatedData.source_wallet_currency} wallet not found`
            );
        }


        // --------------------------------------------------
        // Find destination wallet
        // --------------------------------------------------

        const destinationWallet =
            userWalletDetails.wallets_details.find(
                (wallet) =>
                    wallet.wallet_currency ===
                    validatedData.destination_wallet_currency &&
                    wallet.wallet_status === "ACTIVE"
            );


        if (!destinationWallet) {
            throw new NotFoundError(
                `Active ${validatedData.destination_wallet_currency} wallet not found`
            );
        }


        // --------------------------------------------------
        // Check source wallet balance
        // --------------------------------------------------

        const accountBalance = new Decimal(
            sourceWallet.account_balance?.toString() ?? "0"
        );

        const holdingAmount = new Decimal(
            sourceWallet.holding_amount?.toString() ?? "0"
        );

        const availableBalance =
            accountBalance.minus(holdingAmount);


        const sourceAmount =
            new Decimal(validatedData.amount.toString());


        if (availableBalance.lessThan(sourceAmount)) {
            throw new BadRequestError(
                "Insufficient wallet balance"
            );
        }


        // --------------------------------------------------
        // Get FX rate
        // --------------------------------------------------

        const fxRateDetails = await getWalletFxRate(
            validatedData.source_wallet_currency,
            validatedData.destination_wallet_currency
        );


        const exchangeRate = new Decimal(
            fxRateDetails.exchange_rate.toString()
        );


        if (exchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError(
                "Invalid FX rate received"
            );
        }


        // --------------------------------------------------
        // Calculate gross destination amount
        // --------------------------------------------------

        const grossDestinationAmount =
            sourceAmount
                .mul(exchangeRate)
                .toDecimalPlaces(2);


        // --------------------------------------------------
        // Calculate conversion fee
        // --------------------------------------------------

        const feePercentage = new Decimal(
            FEE_DETAILS.currency_conversion.toString()
        );


        const feeAmount = sourceAmount
            .mul(feePercentage)
            .div(100)
            .toDecimalPlaces(2);


        // --------------------------------------------------
        // Calculate amount after fee
        // --------------------------------------------------

        const sourceAmountAfterFee =
            sourceAmount
                .minus(feeAmount)
                .toDecimalPlaces(2);


        // --------------------------------------------------
        // Calculate destination amount
        // --------------------------------------------------

        const destinationAmount =
            sourceAmountAfterFee
                .mul(exchangeRate)
                .toDecimalPlaces(2);


        // --------------------------------------------------
        // Quote expiry
        // --------------------------------------------------

        const expiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );


        // --------------------------------------------------
        // Create quote
        // --------------------------------------------------
        const conversionQuote = await wallet_currency_conversion_quote.create({

            user_id: userId,

            cardholder_id:
                validatedData.cardholder_id,

            wallet_id:
                userWalletDetails.wallet_id,

            source_currency: validatedData.source_wallet_currency,

            source_amount:
                sourceAmount.toFixed(2),

            destination_currency: validatedData.destination_wallet_currency,

            destination_amount:
                destinationAmount.toFixed(2),

            exchange_rate:
                exchangeRate.toFixed(8),

            fee_percentage:
                feePercentage.toFixed(2),

            fee_amount:
                feeAmount.toFixed(2),

            quote_status: "ACTIVE",

            expires_at: expiresAt,
        });


        // --------------------------------------------------
        // Response
        // --------------------------------------------------

        return {

            status: "SUCCESS",

            data: {

                quote_id:
                    conversionQuote._id.toString(),

                source: {
                    currency:
                        validatedData.source_wallet_currency,

                    amount:
                        sourceAmount.toFixed(2),
                },

                destination: {
                    currency:
                        validatedData.destination_wallet_currency,

                    amount:
                        destinationAmount.toFixed(2),
                },

                exchange_rate:
                    exchangeRate.toFixed(8),

                fee: {
                    currency:
                        validatedData.source_wallet_currency,

                    percentage:
                        feePercentage.toFixed(2),

                    amount:
                        feeAmount.toFixed(2),
                },

                total_debit: {
                    currency:
                        validatedData.source_wallet_currency,

                    amount:
                        sourceAmount.toFixed(2),
                },

                quote_status:
                    conversionQuote.quote_status,

                expires_at:
                    conversionQuote.expires_at,
            },

            message:
                "Currency conversion quote created successfully",
        };

    }
    catch (err) {

        const error = err as any;

        const errorStatus =
            error?.status || "UnknownErrorStatus";


        logger.error(error, {
            serviceName:
                "CreateWalletCurrencyConversionQuoteService"
        });


        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(
            `CreateWalletCurrencyConversionQuoteService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
};
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// --------------------------------- EXECUTE WALLET CURRENCY CONVERSION QUOTE SERVICE --------------------------------- //
export const executeWalletCurrencyConversionQuoteService = async (
    requestSession: Request["session"],
    aesDecryptedQueryData:
        Record<string, string> | ParsedQs | undefined,
    aesDecryptedBodyData:
        Record<string, string> | undefined,
    userConfiguration: userConfigurationsType
): Promise<any> => {

    try {

        if (!aesDecryptedQueryData) {
            throw new BadRequestError(
                "Invalid query data"
            );
        }

        if (!aesDecryptedBodyData) {
            throw new BadRequestError(
                "Invalid body data"
            );
        }


        // --------------------------------------------------
        // Check quote collection
        // --------------------------------------------------

        const isCollectionPresent =
            await checkMongoDbCollectionExist(
                "wallet_currency_conversion_quotes"
            );

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError(
                "Currency conversion quotes collection does not exist in MongoDB"
            );
        }


        // --------------------------------------------------
        // Validate email
        // --------------------------------------------------

        const email = checkStringQueryParams(
            aesDecryptedQueryData,
            "email"
        );

        if (!email) {
            throw new InvalidRequestBodyError(
                "Email not found in request query"
            );
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError(
                "Unauthorized access detected - invalid email"
            );
        }


        // --------------------------------------------------
        // Validate user type
        // --------------------------------------------------

        if (
            requestSession?.userType !== "ADMIN" &&
            requestSession?.userType !== "MASTER_ADMIN"
        ) {
            throw new ForbiddenError(
                "Not authorized to execute currency conversion"
            );
        }


        // --------------------------------------------------
        // Validate configuration
        // --------------------------------------------------

        const sessionBusinessId =
            requestSession?.userConfiguration?.businessId;

        const sessionProgramId =
            requestSession?.userConfiguration?.programId;

        const sessionAgentCode =
            requestSession?.userConfiguration?.agentCode;

        const sessionSubAgentCode =
            requestSession?.userConfiguration?.subAgentCode;


        if (
            userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError(
                "User configuration is not valid to execute currency conversion"
            );
        }


        // --------------------------------------------------
        // Validate quote ID
        // --------------------------------------------------

        const quoteId = aesDecryptedBodyData.quote_id;

        if (!quoteId) {
            throw new InvalidRequestBodyError(
                "Quote ID not found in request body"
            );
        }

        // --------------------------------------------------
        // Validate quote ID
        // --------------------------------------------------
        const cardholderId = aesDecryptedBodyData.cardholder_id;

        if (!cardholderId) {
            throw new InvalidRequestBodyError(
                "Cardholder ID not found in request body"
            );
        }




        // --------------------------------------------------
        // Get user ID
        // --------------------------------------------------

        const userId = requestSession?.userId;

        if (!userId) {
            throw new UnauthorizedError(
                "Unauthorized session detected - user id not found in session"
            );
        }


        // --------------------------------------------------
        // Get quote
        // --------------------------------------------------
        const conversionQuote = await wallet_currency_conversion_quote.findOne({
            _id: quoteId,
            user_id: userId,
            cardholder_id: cardholderId
        });


        if (!conversionQuote) {
            throw new NotFoundError(
                "Currency conversion quote not found"
            );
        }


        // --------------------------------------------------
        // Check quote status
        // --------------------------------------------------

        if (
            conversionQuote.quote_status !==
            "ACTIVE"
        ) {

            throw new ServiceError(
                `Currency conversion quote cannot be executed because its status is ${conversionQuote.quote_status}`
            );
        }


        // --------------------------------------------------
        // Check quote expiry
        // --------------------------------------------------

        if (
            conversionQuote.expires_at.getTime() <=
            Date.now()
        ) {

            await wallet_currency_conversion_quote.updateOne(
                {
                    _id: conversionQuote._id,
                    quote_status: "ACTIVE",
                },
                {
                    $set: {
                        quote_status: "EXPIRED",
                    },
                }
            );

            throw new ServiceError(
                "Currency conversion quote has expired"
            );
        }


        // --------------------------------------------------
        // Get wallet
        // --------------------------------------------------

        const userWalletDetails =
            await user_wallet_details.findOne(
                {
                    user_id: userId,
                    cardholder_id:
                        conversionQuote.cardholder_id,
                },
                {
                    wallet_id: 1,
                    cardholder_id: 1,
                    wallets_details: 1,
                }
            ).lean();


        if (!userWalletDetails) {
            throw new NotFoundError(
                "User wallet details not found"
            );
        }


        // --------------------------------------------------
        // Validate wallet ID
        // --------------------------------------------------

        if (
            userWalletDetails.wallet_id !==
            conversionQuote.wallet_id
        ) {
            throw new BadRequestError(
                "Invalid wallet associated with conversion quote"
            );
        }


        // --------------------------------------------------
        // Source wallet
        // --------------------------------------------------

        const sourceWallet =
            userWalletDetails.wallets_details.find(
                (wallet) =>
                    wallet.wallet_currency ===
                    conversionQuote.source_currency &&
                    wallet.wallet_status === "ACTIVE"
            );


        if (!sourceWallet) {
            throw new NotFoundError(
                `Active ${conversionQuote.source_currency} wallet not found`
            );
        }


        // --------------------------------------------------
        // Destination wallet
        // --------------------------------------------------

        const destinationWallet =
            userWalletDetails.wallets_details.find(
                (wallet) =>
                    wallet.wallet_currency ===
                    conversionQuote.destination_currency &&
                    wallet.wallet_status === "ACTIVE"
            );


        if (!destinationWallet) {
            throw new NotFoundError(
                `Active ${conversionQuote.destination_currency} wallet not found`
            );
        }


        // --------------------------------------------------
        // Check balance again
        // --------------------------------------------------

        const accountBalance =
            new Decimal(
                sourceWallet.account_balance?.toString()
                ?? "0"
            );

        const holdingAmount =
            new Decimal(
                sourceWallet.holding_amount?.toString()
                ?? "0"
            );

        const availableBalance =
            accountBalance.minus(
                holdingAmount
            );


        const sourceAmount =
            new Decimal(
                conversionQuote.source_amount
                    .toString()
            );


        if (
            availableBalance.lessThan(
                sourceAmount
            )
        ) {

            throw new ServiceError(
                "Insufficient wallet balance"
            );
        }


        // --------------------------------------------------
        // Execute MongoDB transaction
        // --------------------------------------------------

        const transactionResult =
            await executeWalletCurrencyConversionTransaction({
                conversionQuote,
                sourceWallet,
                destinationWallet,
                cardholderId:
                    userWalletDetails.cardholder_id,
            });


        return {

            status: "SUCCESS",

            data:
                transactionResult.data,

            message:
                "Currency conversion executed successfully",
        };

    }
    catch (err) {

        const error = err as any;

        const errorStatus =
            error?.status ||
            "UnknownErrorStatus";


        logger.error(error, {
            serviceName:
                "ExecuteWalletCurrencyConversionQuoteService"
        });


        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(
            `ExecuteWalletCurrencyConversionQuoteService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
};