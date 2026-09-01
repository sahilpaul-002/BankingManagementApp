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
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import getWalletTransactionsValidationSchema from "../validations/getWalletTransactionValidation.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { Decimal } from "decimal.js";
import walletCurrencyConversionValidationSchema from "../validations/walletCurrencyConversionValidation.js";
import { FEE_DETAILS } from "../configs/configConstants.js";
import { walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes } from "../models/wallet_currency_conversion_quotes.js";
import getWalletFxRate from "./walletFxRateService.js";
import executeWalletCurrencyConversionTransaction from "../mongoDbTransactions/executeWalletCurrencyConversionTransaction.js";
import { loadWalletValidationSchema, withdrawWalletValidationSchema } from "../validations/userWalletActionValidation.js";
import createWalletCurrencyConversionTransaction from "../mongoDbTransactions/createWalletCurrencyConversionTransaction.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

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
        const cardholderObjectId = new Types.ObjectId(cardholderId)
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to access wallet details")
            }
        }
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
        }

        // Validation optional query params
        const walletType = checkStringQueryParams(aesDecryptedQueryData, "type");
        const walletCurrency = checkStringQueryParams(aesDecryptedQueryData, "currency");
        if (walletType && walletType !== "FIAT" && walletType !== "CRYPTO") {
            throw new InvalidRequestBodyError("Invalid wallet type. Allowed values are FIAT or CRYPTO");
        }
        if (walletCurrency && !["USD", "EUR", "SGD", "USDC", "USDT"].includes(walletCurrency)) {
            throw new InvalidRequestBodyError("Invalid wallet currency");
        }

        // Get user wallet details details
        const userWalletDetails = await user_wallet_details.findOne({
            cardholder_id: cardholderObjectId
        });
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet details not found")
        }

        // Fillter wallets based on query params
        let walletsDetails = userWalletDetails.wallets_details;
        if (walletType || walletCurrency) {
            walletsDetails = walletsDetails.filter((wallet) => {
                const typeMatches = !walletType || wallet.wallet_type === walletType;
                const currencyMatches = !walletCurrency || wallet.wallet_currency === walletCurrency;
                return typeMatches && currencyMatches;
            });
        }
        if (walletsDetails.length === 0) {
            throw new NotFoundError("No wallet found matching the specified wallet filters");
        }

        const walletDetails = {
            walletId: userWalletDetails?._id,
            wallets_details: walletsDetails
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(`GetWalletService facing issue`, sanitizedError);
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
        const cardholderObjectId = new Types.ObjectId(cardholderId)
        let userId: Types.ObjectId;
        if (cardholderId === requestSession?.cardholderId) {
            const sessionUserId = requestSession?.userId;
            if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
                throw new UnauthenticatedError(
                    "Unauthorized session detected - invalid user id"
                );
            }
            userId = new Types.ObjectId(sessionUserId)
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id;
        }

        // Validation user bank details exist and verified
        // Get user bank details details
        const userBankDetailsDoc = await user_bank_details.findOne({
            user_id: userId as Types.ObjectId
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
            available_balance: mongoose.Types.Decimal128.fromString("0"),
            holding_amount: mongoose.Types.Decimal128.fromString("0"),
            wallet_type: validationResult.data.wallet_type,
            wallet_currency: validationResult.data.wallet_currency,
        };

        // Find existing wallet document
        const existingWallet = await user_wallet_details.findOne({ user_id: userId, cardholder_id: new Types.ObjectId(cardholderId) });

        // Existing user → Add wallet
        if (existingWallet) {
            const duplicate = existingWallet.wallets_details.some(
                (wallet) =>
                    wallet.wallet_currency === newWallet.wallet_currency
            );

            if (duplicate) {
                throw new ServiceError(`${newWallet.wallet_currency} wallet already exists`);
            }

            existingWallet.wallets_details.push(newWallet);

            await existingWallet.save();

            requestSession.walletId = existingWallet._id.toString();

            return { status: "SUCCESS", message: "Wallet added successfully", data: { walletId: existingWallet._id, wallets_details: existingWallet.wallets_details, } };
        }

        // First wallet → Create document
        const insertedDocument: userWalletDetailsSchemaTypes = await user_wallet_details.create({
            user_id: userId as Types.ObjectId,
            cardholder_id: cardholderObjectId,
            wallets_details: [
                newWallet,
            ],
        });

        requestSession.walletId = insertedDocument._id.toString();

        return { status: "SUCCESS", message: "Wallet created successfully", data: { walletId: insertedDocument._id, wallets_details: insertedDocument.wallets_details, } };
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(`CreateWalletService facing issue`, sanitizedError);
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
        if (!cardholderId || !Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Invalid cardholder-id not found in request request body")
        }
        const cardholderObjectId = new Types.ObjectId(cardholderId)
        // Check email present in request body
        const walletId: string | null = checkStringBody(walletDetails, "wallet_id")
        if (!walletId || !Types.ObjectId.isValid(walletId)) {
            throw new InvalidRequestBodyError("Invalid wallet-id not present in the request body");
        }
        const walletObjectId = new Types.ObjectId(walletId)
        let userId: Types.ObjectId;
        if (cardholderId === requestSession?.cardholderId) {
            const sessionUserId = requestSession?.userId;
            if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
                throw new UnauthenticatedError(
                    "Unauthorized session detected - invalid user id"
                );
            }
            userId = new Types.ObjectId(sessionUserId)
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id;
        }

        const amountDecimal = new Decimal(walletDetails?.amount?.toString())

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof loadWalletValidationSchema>> = loadWalletValidationSchema.safeParse(
            {
                wallet_type: walletDetails?.wallet_type,
                wallet_currency: walletDetails?.wallet_currency,
                network: walletDetails?.network,
                amount: amountDecimal,
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
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ _id: walletObjectId, cardholder_id: cardholderObjectId }).lean();

        // Check user exist in DB
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet does not exists");
        }

        // Check wallet authenticity
        if (userWalletDetails?.user_id.toString() !== userId.toString()) {
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
        const loadWalletTransactionResult = await userLoadWalletTransaction(userId, cardholderObjectId, walletObjectId, validationResult, selectedWallet)

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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(`LoadWalletService facing issue`, sanitizedError);
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
        const cardholderObjectId = new Types.ObjectId(cardholderId)
        // Check email present in request body
        const walletId: string | null = checkStringBody(walletDetails, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        const walletObjectId = new Types.ObjectId(walletId)
        let userId: Types.ObjectId;
        if (cardholderId === requestSession?.cardholderId) {
            const sessionUserId = requestSession?.userId;
            if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
                throw new UnauthenticatedError(
                    "Unauthorized session detected - invalid user id"
                );
            }
            userId = new Types.ObjectId(sessionUserId)
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id;
        }

        const amountDecimal = new Decimal(walletDetails?.amount?.toString());

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof withdrawWalletValidationSchema>> = withdrawWalletValidationSchema.safeParse(
            {
                wallet_type: walletDetails?.wallet_type,
                wallet_currency: walletDetails?.wallet_currency,
                amount: amountDecimal,
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
        const userWalletDetails: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ _id: walletObjectId, cardholder_id: cardholderObjectId }).lean();

        // Check user exist in DB
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet does not exists");
        }

        // Check wallet authenticity
        if (userWalletDetails?.user_id.toString() !== userId.toString()) {
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
        const withdrawWalletTransactionResult = await userWithdrawWalletTransaction(userId, cardholderObjectId, walletObjectId, validationResult, selectedWallet)

        if (withdrawWalletTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Widthraw wallet service failed to withdraw wallet")
        }

        return { status: "SUCCESS", message: "Wallet withdrawed successfully", data: withdrawWalletTransactionResult?.data }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "WithdrawWalletService",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(`WithdrawWalletService facing issue`, sanitizedError);
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
        const cardholderObjectId = new Types.ObjectId(cardholderId)
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to to access wallet transactions")
            }
        }
        const walletId: string | null = checkStringQueryParams(aesDecryptedQueryData, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        const walletObjectId = new Types.ObjectId(walletId)
        let userId: Types.ObjectId;
        if (cardholderId === requestSession?.cardholderId) {
            const sessionUserId = requestSession?.userId;
            if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
                throw new UnauthenticatedError(
                    "Unauthorized session detected - invalid user id"
                );
            }
            userId = new Types.ObjectId(sessionUserId)
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id;
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
        const wallet: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ _id: walletObjectId, cardholder_id: cardholderObjectId }).lean();

        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }

        // Date range filter
        const dateFilter: {
            $gte?: Date;
            $lte?: Date;
        } = {};
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
            wallet_id: walletObjectId,
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
            fee: 1,
            balance_after: 1,
            remarks: 1,
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
                    total_pages: totalPages,
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetWalletTransactionService facing issue`, sanitizedError);
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
        const cardholderObjectId = new Types.ObjectId(cardholderId)
        const walletId: string | null = checkStringQueryParams(aesDecryptedQueryData, "wallet_id")
        if (!walletId) {
            throw new InvalidRequestBodyError("Wallet-id not present in the request body");
        }
        const walletObjectId = new Types.ObjectId(walletId)
        let userId: Types.ObjectId;
        if (cardholderId === requestSession?.cardholderId) {
            const sessionUserId = requestSession?.userId;
            if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
                throw new UnauthenticatedError(
                    "Unauthorized session detected - invalid user id"
                );
            }
            userId = new Types.ObjectId(sessionUserId)
        }
        else {
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("_id").lean();
            if (!cardholderDetails) {
                throw new ServiceError("Cardholder Id provided is invalid or does not exist or cardholder bank details not verified")
            }
            userId = cardholderDetails?._id;
        }

        // Verify wallet
        const wallet: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({ _id: walletObjectId, cardholder_id: cardholderObjectId }).lean();

        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }

        if (!Types.ObjectId.isValid(transactionId)) {
            throw new InvalidRequestParamsError("Transaction not present in the params")
        }
        // Get Wallet Transaction Details
        const transaction = await user_wallet_transactions.findOne({
            wallet_id: walletObjectId,
            transaction_id: new Types.ObjectId(transactionId),
        }).select("transaction_id transaction_type transaction_status wallet_details amount balance_after createdAt").lean();

        if (!transaction) {
            throw new NotFoundError("Wallet transactions not found")
        }

        return { status: "SUCCESS", message: "Wallet transaction fetched successfully", data: { walletId, transaction } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetWalletTransactionDetailsService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetWalletTransactionDetailsService facing issue`, sanitizedError);
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

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("wallet_currency_conversion_quotes");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Currency conversion quotes collection does not exist in MongoDB");
        }

        // Validate email
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError(
                "Unauthorized access detected - invalid email"
            );
        }

        // Validate user type
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to create currency conversion quote");
        }

        // Validate configuration
        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;

        if (userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError("User configuration is not valid to create currency conversion quote");
        }

        // Validate request body amount
        const amount = aesDecryptedBodyData.amount;
        if (amount === undefined || amount === null || amount.trim() === "") {
            throw new InvalidRequestBodyError("Amount is required");
        }
        const amountDecimal = new Decimal(amount);

        // Validate request body
        const validationResult = walletCurrencyConversionValidationSchema.safeParse({
            cardholder_id: aesDecryptedBodyData.cardholder_id,
            source_wallet_currency: aesDecryptedBodyData.source_wallet_currency,
            destination_wallet_currency: aesDecryptedBodyData.destination_wallet_currency,
            amount: amountDecimal,
        });
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }
        const validatedData = validationResult.data;

        // Get user ID
        const sessionUserId = requestSession?.userId;
        if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
            throw new UnauthenticatedError(
                "Unauthorized session detected - invalid user id"
            );
        }
        const userId = new Types.ObjectId(sessionUserId)

        // Get cardholder objectId
        const cardholderId = validatedData.cardholder_id
        if (!Types.ObjectId.isValid(cardholderId)) {
            throw new BadRequestError("Invalid cardholder ID");
        }
        const cardholderObjectId = new Types.ObjectId(cardholderId);

        // Get wallet details
        const userWalletDetails = await user_wallet_details.findOne(
            {
                user_id: userId,
                cardholder_id: cardholderObjectId,
            },
            {
                _id: 1,
            }
        ).lean();
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet details not found");
        }

        // Check source wallet balance
        const sourceAmount = new Decimal(validatedData.amount.toString());

        // Get FX rate
        const fxRateDetails = await getWalletFxRate(
            validatedData.source_wallet_currency,
            validatedData.destination_wallet_currency
        );
        const exchangeRate = new Decimal(fxRateDetails.exchange_rate.toString());

        if (exchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid FX rate received");
        }

        // Calculate gross destination amount
        const grossDestinationAmount = sourceAmount.mul(exchangeRate).toDecimalPlaces(4);

        // Calculate conversion fee
        const isCryptoConversion = (validatedData.source_wallet_currency === "USD" && ["USDT", "USDC"].includes(validatedData.destination_wallet_currency)) || (["USDT", "USDC"].includes(validatedData.source_wallet_currency) && validatedData.destination_wallet_currency === "USD");
        const feePercentage = new Decimal((isCryptoConversion ? FEE_DETAILS.crypto_currency_conversion : FEE_DETAILS.currency_conversion).toString());

        const feeAmount = sourceAmount.mul(feePercentage).div(100).toDecimalPlaces(4);

        // Calculate amount after fee
        const sourceAmountAfterFee = sourceAmount.minus(feeAmount).toDecimalPlaces(4);

        // Calculate destination amount
        const destinationAmount = sourceAmountAfterFee.mul(exchangeRate).toDecimalPlaces(4);

        // Quote expiry
        const expiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        const transactionResult = await createWalletCurrencyConversionTransaction({
            userId,
            cardholderId: cardholderObjectId,
            walletId: userWalletDetails._id,
            sourceCurrency: validatedData.source_wallet_currency,
            destinationCurrency: validatedData.destination_wallet_currency,
            sourceAmount,
            destinationAmount,
            exchangeRate,
            feePercentage,
            feeAmount,
            expiresAt,
        });

        return {
            status: "SUCCESS",
            data: {
                quote_id: transactionResult.conversionQuote._id.toString(),
                source: {
                    currency: validatedData.source_wallet_currency,
                    amount: sourceAmount.toFixed(4),
                },
                destination: {
                    currency: validatedData.destination_wallet_currency,
                    amount: destinationAmount.toFixed(4),
                },
                exchange_rate: exchangeRate.toFixed(8),
                fee: {
                    currency: validatedData.source_wallet_currency,
                    percentage: feePercentage.toFixed(4),
                    amount: feeAmount.toFixed(4),
                },
                total_debit: {
                    currency: validatedData.source_wallet_currency,
                    amount: sourceAmount.toFixed(4),
                },
                quote_status: transactionResult.conversionQuote.quote_status,
                expires_at: transactionResult.conversionQuote.expires_at,
            },
            message: "Currency conversion quote created successfully",
        };

    }
    catch (err) {
        const error = err as any;

        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName:
                "CreateWalletCurrencyConversionQuoteService"
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CreateWalletCurrencyConversionQuoteService facing issue`, sanitizedError);
    }
};
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// --------------------------------- EXECUTE WALLET CURRENCY CONVERSION QUOTE SERVICE --------------------------------- //
export const executeWalletCurrencyConversionQuoteService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType): Promise<any> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check quote collection
        const isCollectionPresent = await checkMongoDbCollectionExist("wallet_currency_conversion_quotes");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Currency conversion quotes collection does not exist in MongoDB");
        }

        // Validate email
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError(
                "Unauthorized access detected - invalid email"
            );
        }

        // Validate user type
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to execute currency conversion");
        }

        // Validate configuration
        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;

        if (userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError("User configuration is not valid to execute currency conversion");
        }

        // Validate quote ID
        const quoteId = aesDecryptedBodyData.quote_id;
        if (!quoteId) {
            throw new InvalidRequestBodyError("Quote ID not found in request body");
        }
        if (!Types.ObjectId.isValid(quoteId)) {
            throw new InvalidRequestBodyError(
                "Invalid quote ID"
            );
        }
        const quoteObjectId = new Types.ObjectId(quoteId);

        // Validate Cardholder ID
        const cardholderId = aesDecryptedBodyData.cardholder_id;
        if (!cardholderId) {
            throw new InvalidRequestBodyError("Cardholder ID not found in request body");
        }
        if (!Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Invalid cardholder ID");
        }
        const cardholderObjectId = new Types.ObjectId(cardholderId);

        // Get user ID
        const sessionUserId = requestSession?.userId;
        if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
            throw new UnauthenticatedError(
                "Unauthorized session detected - invalid user id"
            );
        }
        const userId = new Types.ObjectId(sessionUserId);

        // Get quote
        const conversionQuote = await wallet_currency_conversion_quotes.findOne({
            _id: quoteObjectId,
            user_id: userId,
            cardholder_id: cardholderObjectId
        });
        if (!conversionQuote) {
            throw new NotFoundError("Currency conversion quote not found");
        }

        // Check quote status
        if (conversionQuote.quote_status !== "ACTIVE") {
            throw new ServiceError(`Currency conversion quote cannot be executed because its status is ${conversionQuote.quote_status}`);
        }

        // Check quote expiry
        if (conversionQuote.expires_at.getTime() <= Date.now()) {

            await wallet_currency_conversion_quotes.updateOne(
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

        // Execute MongoDB transaction
        const transactionResult = await executeWalletCurrencyConversionTransaction({
            conversionQuote,
            userId,
            cardholderId: cardholderObjectId,
            walletId: conversionQuote.wallet_id,
        });

        return {
            status: "SUCCESS",
            data: transactionResult.data,
            message: "Currency conversion executed successfully",
        };

    }
    catch (err) {
        const error = err as any;

        const errorStatus =
            error?.status ||
            "UnknownErrorStatus";


        logger.error(error, { serviceName: "ExecuteWalletCurrencyConversionQuoteService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`ExecuteWalletCurrencyConversionQuoteService facing issue`, sanitizedError);
    }
};
// -------------------------------------------- XXXXXXXXXXXXXXXXXXXXXX -------------------------------------------- \\