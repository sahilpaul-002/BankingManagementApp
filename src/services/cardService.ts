import type { Request } from "express";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userCardDetailsModel as user_card_details } from "../models/user_card_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import type { walletDetailsType, } from "../types/schemaTypes.js";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { ParsedQs } from "qs";
import checkStringBody from "../utils/checkStringBody.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import userCardCreationValidation from "../validations/userCardCreationValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userCreateCardTransaction from "../mongoDbTransactions/userCreateCardTransaction.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import userCardUpdateValidationSchema from "../validations/userCardUpdateValidation.js";
import { userCardTransactionsModel as user_card_transactions } from "../models/user_card_transaction_details.js";
import getCardTransactionsValidationSchema from "../validations/getCardTransactionsValidation.js";
import initiateCardTransaction from "../mongoDbTransactions/initiateCardTransaction.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import generateEmailTemplate from "../utils/generateEmailTemplate.js";
import { gmailSendService } from "./gmailSendService.js";
import cardTransactionSettlementTransaction from "../mongoDbTransactions/cardTransactionSettelmentTransaction.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import mongoose, { Types } from "mongoose";
import { Decimal } from "decimal.js"

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"
const bmaNotificationMail = process.env.BMA_EMAIL || "bma_notification@yopmail.com"

type userConfigurationsType = {
    businessId: string;
    programId: string;
    agentCode: string;
    subAgentCode: string;
}

// ----------------------------------- CREATE CARD SERVICE ----------------------------------- \\
export const createCardService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, any> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate session cardholderId
        if (!requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - cardholderId not found in session");
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
            throw new ForbiddenError("Not authorized to create card")
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
            throw new ForbiddenError("User configuration is not valid to access to create card")
        }
        const cardholderId = checkStringBody(aesDecryptedBodyData, "cardholder_id");
        if (!cardholderId || !Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Valid cardholder-id not found in request request body")
        }

        const cardholderObjectId = new Types.ObjectId(cardholderId);
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
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

        // Create card transaction
        const cardCreationTransactionResult = await userCreateCardTransaction(cardholderObjectId, validationResult)

        if (cardCreationTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Create card service is facing issue - failed to create user card")
        }

        const cardDetails = {
            cardholderId: cardCreationTransactionResult?.data?.cardholder_id,
            cardId: cardCreationTransactionResult?.data?._id,
            cardNumber: cardCreationTransactionResult?.data?.card_number,
            nameOnCard: cardCreationTransactionResult?.data?.name_on_card,
            cardStatus: cardCreationTransactionResult?.data?.card_status,
            cardLimits: cardCreationTransactionResult?.data?.card_limits,
            issueDate: cardCreationTransactionResult?.data?.issued_date,
            validDate: cardCreationTransactionResult?.data?.valid_date,
            cardType: cardCreationTransactionResult?.data?.card_type,
            cardCurrency: cardCreationTransactionResult?.data?.card_currency,
        };

        return { status: "SUCCESS", message: "Card created successfully", data: cardDetails };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "CreateCardService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CreateCardService facing issue`, sanitizedError);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


// ----------------------------------- GET CARDS LIST SERVICE ----------------------------------- \\
export const getCardsListService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Validate Email & User Id & Cardholder Id
        const email = checkStringBody(aesDecryptedQueryData, "email");
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
            throw new ForbiddenError("User configuration is not valid to access card list")
        }
        const cardholderId = checkStringBody(aesDecryptedQueryData, "cardholder_id");
        if (!cardholderId || !Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Valid cardholder-id not found in request body")
        }

        const cardholderObjectId = new Types.ObjectId(cardholderId);
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to get card list")
            }
        }
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
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

        // Check page in request
        const requestedPage = Number(aesDecryptedQueryData.page ?? 1);
        if (!Number.isInteger(requestedPage) || requestedPage < 1) {
            throw new BadRequestError("Page must be a positive integer");
        }
        // Cehck page size in request
        const pageSize = Number(aesDecryptedQueryData.page_size ?? 30);
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
            throw new BadRequestError("Page size must be between 1 and 50");
        }

        // Get total matching transactions
        const totalCards = await user_card_details.countDocuments({ cardholder_id: cardholderObjectId })
        // Calculate total pages
        const totalPages = Math.max(1, Math.ceil(totalCards / pageSize));
        // Calculate current page
        const currentPage = Math.min(requestedPage, totalPages);
        // Calculate skip using the corrected page
        const skip = (currentPage - 1) * pageSize; // Skip fetching documents for page number more than 1

        // Fetch Cards List
        const cardsList = await user_card_details.find({ cardholder_id: cardholderObjectId }).select("-cardholder_id -cvv -valid_date -valid_merchant_categories -createdAt -updatedAt -__v").sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean()

        if (!Array.isArray(cardsList) || cardsList.length === 0) {
            throw new NotFoundError("No cards associated with this cardholder found")
        }

        return {
            status: "SUCCESS",
            message: "Cards retrieved successfully",
            data: {
                cardholderId: cardholderId,
                pagination: {
                    current_page: currentPage,
                    page_size: pageSize,
                    total_records: totalCards,
                    total_pages: Math.ceil(totalCards / pageSize),
                    has_next_page: currentPage * pageSize < totalCards,
                    has_previous_page: currentPage > 1,
                },
                cards: cardsList,
            },
        };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetCardsListService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetCardsListService facing issue`, sanitizedError);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\


// ----------------------------------- GET CARDS DETAILS SERVICE ----------------------------------- \\
export const getCardDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType, cardId?: string): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Check userEmail from session
        if (!requestSession?.userEmail) {
            throw new UnauthenticatedError("Unauthenticated access detected - email not found in session");
        }

        // Check cardholderId from session
        if (!requestSession?.cardholderId) {
            throw new UnauthenticatedError("Unauthenticated access detected - cardholderId not found in session");
        }

        // Validate Email & User Id & Cardholder Id
        const email = checkStringBody(aesDecryptedQueryData, "email");
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
        const cardholderId = checkStringBody(aesDecryptedQueryData, "cardholder_id");
        if (!cardholderId || !Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Valid cardholder-id not found in request body")
        }

        const cardholderObjectId = new Types.ObjectId(cardholderId);
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to get card details")
            }
        }
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
        }

        // Validate card id
        if (!cardId || !Types.ObjectId.isValid(cardId)) {
            throw new InvalidRequestBodyError("Valid card-id not found in request query params")
        }
        const cardObjectId = new Types.ObjectId(cardId)

        // Fetch Card Details
        const cardDetails = await user_card_details.findOne({
            cardholder_id: cardholderId,
            _id: cardObjectId,
        }).select("-cardholder_id -cvv -valid_date -valid_merchant_categories -createdAt -updatedAt -__v").lean();

        if (!cardDetails) {
            throw new NotFoundError("Card and card details not found")
        }

        return { status: "SUCCESS", message: "Card details fetched successfully", data: { cardholderId, cardDetails } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetCardDetailsService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetCardDetailsService facing issue`, sanitizedError);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\


// ----------------------------------- UPDATE CARDS STATUS SERVICE ----------------------------------- \\
export const updateCardStatusService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType, cardId?: string): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Check userEmail from session
        if (!requestSession?.userEmail) {
            throw new UnauthenticatedError("Unauthenticated access detected - email not found in session");
        }

        // Check cardholderId from session
        if (!requestSession?.cardholderId) {
            throw new UnauthenticatedError("Unauthenticated access detected - cardholderId not found in session");
        }

        // Check card status
        const cardStatus = checkStringBody(aesDecryptedBodyData, "card_status");
        if (!cardStatus) {
            throw new InvalidRequestBodyError("card_status not found in request query params")
        }

        // Validate Email & User Id & Cardholder Id
        const email = checkStringBody(aesDecryptedBodyData, "email");
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
        const cardholderId = checkStringBody(aesDecryptedBodyData, "cardholder_id");
        if (!cardholderId || !Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Valid cardholder-id not found in request body")
        }

        const cardholderObjectId = new Types.ObjectId(cardholderId);
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to update card status")
            }
        }
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
        }

        // Validate card id
        if (!cardId || !Types.ObjectId.isValid(cardId)) {
            throw new InvalidRequestBodyError("Valid card-id not found in request query params")
        }
        const cardObjectId = new Types.ObjectId(cardId)

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userCardUpdateValidationSchema>> = userCardUpdateValidationSchema.safeParse(aesDecryptedBodyData);
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

        // Update Card Details
        const updatedCardDetails = await user_card_details.findOneAndUpdate(
            {
                _id: cardObjectId,
                cardholder_id: cardholderObjectId
            },
            {
                $set: {
                    card_status: validationResult.data.card_status,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-cardholder_id -cvv -valid_date -valid_merchant_categories -createdAt -updatedAt -__v").lean();;

        if (!updatedCardDetails) {
            throw new NotFoundError("Card and card details not found");
        }

        return { status: "SUCCESS", message: "Card status updated successfully", data: { cardholderId, cardDetails: updatedCardDetails } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "UpdateCardStatusService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UpdateCardStatusService facing issue`, sanitizedError);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\


// ----------------------------------- UPDATE CARDS LIMITS SERVICE ----------------------------------- \\
export const updateCardLimitsService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType, cardId?: string): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Check userEmail from session
        if (!requestSession?.userEmail) {
            throw new UnauthenticatedError("Unauthenticated access detected - email not found in session");
        }

        // Check cardholderId from session
        if (!requestSession?.cardholderId) {
            throw new UnauthenticatedError("Unauthenticated access detected - cardholderId not found in session");
        }

        // Check card limits present in request body
        if (!aesDecryptedBodyData?.card_limits) {
            throw new InvalidRequestBodyError("Card_limits not found in the request body");
        }

        // Validate Email & User Id & Cardholder Id
        const email = checkStringBody(aesDecryptedBodyData, "email");
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
        const cardholderId = checkStringBody(aesDecryptedBodyData, "cardholder_id");
        if (!cardholderId || !Types.ObjectId.isValid(cardholderId)) {
            throw new InvalidRequestBodyError("Valid cardholder-id not found in request body")
        }

        const cardholderObjectId = new Types.ObjectId(cardholderId);
        // Check user type for non-user's cardholder id
        if (cardholderId !== requestSession?.cardholderId) {
            if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
                throw new ForbiddenError("Not authorized to update card limits")
            }
        }
        const cardHolderExist = await user_details.exists({ cardholder_id: cardholderObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode });
        if (!cardHolderExist) {
            throw new ServiceError("Cardholder Id provided is invalid or does not exist")
        }

        // Validate card id
        if (!cardId || !Types.ObjectId.isValid(cardId)) {
            throw new InvalidRequestBodyError("Valid card-id not found in request query params")
        }
        const cardObjectId = new Types.ObjectId(cardId)

        if (!aesDecryptedBodyData?.card_limits || typeof aesDecryptedBodyData?.card_limits !== "object" || Array.isArray(aesDecryptedBodyData?.card_limits) || Object.keys(aesDecryptedBodyData?.card_limits).length === 0
        ) {
            throw new InvalidRequestBodyError("Card limits not present in request body")
        }

        // Check Card Status
        const card = await user_card_details.findOne({ cardholder_id: cardholderId, _id: cardObjectId }).select("card_status card_limits").lean();
        if (!card) {
            throw new NotFoundError("Card not found");
        }
        if (card.card_status !== "ACTIVE") {
            throw new BadRequestError("Card limits can only be updated when the card is ACTIVE state");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userCardUpdateValidationSchema>> = userCardUpdateValidationSchema.safeParse(aesDecryptedBodyData);
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
        const updateData = validationResult.data;

        // COnfigure the limits merging the existing and incoming limits
        const mergedLimits = {
            daily_limit: updateData.card_limits?.daily_limit !== undefined ? new Decimal(updateData.card_limits.daily_limit).toDecimalPlaces(4) : new Decimal(card?.card_limits?.daily_limit?.toString() ?? "0").toDecimalPlaces(4),
            monthly_limit: updateData.card_limits?.monthly_limit !== undefined ? new Decimal(updateData.card_limits.monthly_limit).toDecimalPlaces(4) : new Decimal(card?.card_limits?.monthly_limit?.toString() ?? "0").toDecimalPlaces(4),
            yearly_limit: updateData.card_limits?.yearly_limit !== undefined ? new Decimal(updateData.card_limits.yearly_limit).toDecimalPlaces(4) : new Decimal(card?.card_limits?.yearly_limit?.toString() ?? "0").toDecimalPlaces(4),
        };

        // Validate limit amounts
        const daily = mergedLimits.daily_limit;
        const monthly = mergedLimits.monthly_limit;
        const yearly = mergedLimits.yearly_limit;
        if (daily.greaterThanOrEqualTo(monthly)) {
            throw new BadRequestError("Daily limit must be less than monthly limit");
        }
        if (monthly.greaterThanOrEqualTo(yearly)) {
            throw new BadRequestError("Monthly limit must be less than yearly limit");
        }

        // Build update object
        const updateFields: Record<string, mongoose.Types.Decimal128> = {};
        if (updateData.card_limits) {
            Object.entries(updateData.card_limits).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields[`card_limits.${key}`] =
                        mongoose.Types.Decimal128.fromString(value.toString());
                }
            });
        }

        // Update Card Details
        const updatedCard = await user_card_details.findOneAndUpdate(
            {
                cardholder_id: cardholderObjectId,
                _id: cardObjectId,
            },
            {
                $set: updateFields,
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-cardholder_id -cvv -valid_date, -valid_merchant_categories -createdAt -updatedAt -__v").lean();

        if (!updatedCard) {
            throw new ServiceError("Failed update card limits");
        }

        return { status: "SUCCESS", message: "Card limits updated successfully", data: { cardholderId, cardDetails: updatedCard } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "UpdateCardLimitsService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UpdateCardLimitsService facing issue`, sanitizedError);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\


// ----------------------------------- GET CARD TRANSACTIONS ----------------------------------- \\
export const getCardTransactionsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_transactions");

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
                throw new ForbiddenError("Not authorized to get card transactions")
            }
        }
        const cardId: string | null = checkStringQueryParams(aesDecryptedQueryData, "card_id")
        if (!cardId) {
            throw new InvalidRequestBodyError("Card-id not present in the request body");
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

        // Verify card
        const cardExists = await user_card_details.exists({ card_id: cardId, cardholder_id: cardholderId });
        if (!cardExists) {
            throw new NotFoundError("Card not found");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof getCardTransactionsValidationSchema>> = getCardTransactionsValidationSchema.safeParse(aesDecryptedQueryData);
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
            cardholder_id: cardholderId,
            card_id: cardId,
            ...(validationResult.data.transaction_type && { transaction_type: validationResult.data.transaction_type }),
            ...(validationResult.data.transaction_status && { transaction_status: validationResult.data.transaction_status }),
            ...(validationResult.data.card_type && { card_type: validationResult.data.card_type }),
            ...(validationResult.data.currency && { currency: validationResult.data.currency }),
            ...(validationResult.data.merchant_category && { merchant_category: validationResult.data.merchant_category }),
            ...(validationResult.data.merchant_country && { merchant_country: validationResult.data.merchant_country }),
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        };

        // Get total matching transactions
        const totalTransactions = await user_card_transactions.countDocuments(query);
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
            currency: 1,
            merchant_name: 1,
            merchant_category: 1,
            merchant_country: 1,
            card_type: 1,
            createdAt: 1,
        };

        // Fetch transactions
        const transactions = await user_card_transactions.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).select(querySelect).lean();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            throw new NotFoundError("card transactions not found")
        }

        return {
            status: "SUCCESS",
            message: "Card transactions fetched successfully",
            data: {
                cardholder_id: cardholderId,
                card_id: cardId,

                pagination: {
                    current_page: currentPage,
                    page_size: pageSize,
                    total_records: totalTransactions,
                    total_pages: totalPages,
                    has_next_page: currentPage < totalPages,
                    has_previous_page: currentPage > 1,
                },

                transactions,
            },
        }
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetCardTransactionService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetCardTransactionService facing issue`, sanitizedError);
    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\


// ----------------------------------- GET CARD TRANSACTION DETAILS ----------------------------------- \\
export const getCardTransactionDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType, transactionId?: string): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_transactions");
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
            throw new ForbiddenError("User configuration is not valid to access card transaction details")
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
        const cardId: string | null = checkStringQueryParams(aesDecryptedQueryData, "card_id")
        if (!cardId) {
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

        // Verify card
        const cardExists = await user_card_details.exists({ card_id: cardId, cardholder_id: cardholderId });
        if (!cardExists) {
            throw new NotFoundError("Card not found");
        }

        // Get Card Transaction Details
        const transaction = await user_card_transactions.findOne({
            card_id: cardId,
            transaction_id: transactionId,
        }).select(`transaction_id
            transaction_type
            transaction_status
            amount
            currency
            card_type
            merchant_name
            merchant_category
            merchant_country
            reference_id
            remarks
            createdAt`).lean();

        if (!transaction) {
            throw new NotFoundError("Card transaction not found")
        }

        return { status: "SUCCESS", message: "Card transaction fetched successfully", data: { cardId, transaction } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetCardTransactionDetailsService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetCardTransactionDetailsService facing issue`, sanitizedError);
    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


// ----------------------------------- CREATE CARD TRANSACTION ----------------------------------- \\
const validateCardDetails = (cardDetails: Record<string, any>, cvvNumber: string, validThru: string, amount: string, currency: string, merchantName: string, merchantCategory: string, merchantCountry: string) => {
    // 1. Verify CVV
    if (cardDetails.cvv !== cvvNumber) {
        throw new ServiceError("Transaction failed - Invalid card details");
    }

    // 2. Verify expiry date
    const [expMonth, expYear] = validThru.split("/");

    if (!expMonth || !expYear) {
        throw new ServiceError("Transaction failed - Invalid Valid-Thru format");
    }

    const cardExpiry = new Date(cardDetails.valid_date);

    const storedMonth = String(cardExpiry.getMonth() + 1).padStart(2, "0");
    const storedYear = String(cardExpiry.getFullYear()).slice(-2);

    if (storedMonth !== expMonth || storedYear !== expYear) {
        throw new ServiceError("Transaction failed - Invalid card details");
    }

    // 3. Check card status
    if (cardDetails.card_status !== "ACTIVE") {
        throw new ServiceError(
            `Transaction failed - Card cannot be used because it is ${cardDetails.card_status} status`
        );
    }

    // 4. Check card expiry
    const today = new Date();

    if (cardExpiry < today) {
        throw new ServiceError("Transaction failed - Card has expired");
    }

    // 5. Verify currency
    if (cardDetails.card_currency !== currency) {
        throw new ServiceError("Transaction failed - Card currency does not match transaction currency");
    }

    // 6. Verify merchant category
    if (
        !cardDetails.valid_merchant_categories.includes(merchantCategory)
    ) {
        throw new ServiceError(
            "Transaction failed - Transactions are not allowed for this merchant category"
        );
    }

    // Verify Limits
    const amountNumber = Number(amount);
    const now = new Date();

    // 7. Verify daily limit
    let dailySpent = 0;
    if (cardDetails.daily_transaction && cardDetails.daily_transaction.date.toDateString() === now.toDateString()) {
        dailySpent = Number(cardDetails.daily_transaction.debit.toString());
    }
    const dailyLimit = Number(cardDetails.card_limits.daily_limit.toString());
    if (dailySpent + amountNumber > dailyLimit) {
        throw new ServiceError("Daily card limit exceeded");
    }

    // 8. Verify monthly limit
    let monthlySpent = 0;
    const monthly = cardDetails.monthly_transaction;
    if (monthly.month === now.getMonth() + 1 && monthly.year === now.getFullYear()) {
        monthlySpent = Number(monthly.debit.toString());
    }
    const monthlyLimit = Number(cardDetails.card_limits.monthly_limit.toString());
    if (monthlySpent + amountNumber > monthlyLimit) {
        throw new ServiceError("Monthly card limit exceeded");
    }

    // 9. Verify yearly limit
    let yearlySpent = 0;
    const yearly = cardDetails.yearly_transaction;
    if (yearly.year === now.getFullYear()) {
        yearlySpent = Number(yearly.debit.toString());
    }
    const yearlyLimit = Number(cardDetails.card_limits.yearly_limit.toString());
    if (yearlySpent + amountNumber > yearlyLimit) {
        throw new ServiceError("Yearly card limit exceeded");
    }

    return true;
}
export const createCardTransactionService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Get card details from request
        const cardNumber = checkStringBody(aesDecryptedBodyData, "card_number")
        if (!cardNumber) {
            throw new InvalidRequestBodyError("Card-Number is not present in the request")
        }
        const validThru = checkStringBody(aesDecryptedBodyData, "valid_thru")
        if (!validThru) {
            throw new InvalidRequestBodyError("Valid-Thru date is not present in the request")
        }
        const cvvNumber = checkStringBody(aesDecryptedBodyData, "cvv")
        if (!cvvNumber) {
            throw new InvalidRequestBodyError("CVV number is not present in the request")
        }
        const amount = checkStringBody(aesDecryptedBodyData, "amount")
        if (!amount) {
            throw new InvalidRequestBodyError("Amount is not present in the request")
        }
        const currency = checkStringBody(aesDecryptedBodyData, "currency")
        if (!currency) {
            throw new InvalidRequestBodyError("Currency is not present in the request")
        }
        const merchantName = checkStringBody(aesDecryptedBodyData, "merchant_name")
        if (!merchantName) {
            throw new InvalidRequestBodyError("Merchant-Name is not present in the request")
        }
        const merchantCategory = checkStringBody(aesDecryptedBodyData, "merchant_category")
        if (!merchantCategory) {
            throw new InvalidRequestBodyError("Merchant-Category is not present in the request")
        }
        const merchantCountry = checkStringBody(aesDecryptedBodyData, "merchant_country")
        if (!merchantCountry) {
            throw new InvalidRequestBodyError("Merchant-Country is not present in the request")
        }
        const transactionType = checkStringBody(aesDecryptedBodyData, "transaction_type")
        if (!transactionType || !["PURCHASE", "WITHDRAWAL", "REFUND"].includes(transactionType)) {
            throw new InvalidRequestBodyError("Transaction-Type is not valid, must be [PURCHASE | WITHDRAWAL | REFUND]")
        }
        const authorizationType = checkStringBody(aesDecryptedBodyData, "authorization_type")
        if (!authorizationType || !["HOLD", "IMMEDIATE"]?.includes(authorizationType)) {
            throw new InvalidRequestBodyError("Authorization-Type is not valid, must be [HOLD | IMMEDIATE]")
        }

        // Verify card
        const cardDetails = await user_card_details.findOne({ card_number: cardNumber }).lean();
        if (!cardDetails) {
            throw new NotFoundError("Card not found");
        }

        const cardDetailsValidation = validateCardDetails(cardDetails, cvvNumber, validThru, amount, currency, merchantName, merchantCategory, merchantCountry)
        if (!cardDetailsValidation) {
            throw new ServiceError("Transaction failed - Invalid card details")
        }

        // Validate USD Wallet Balance \\
        const wallet = await user_wallet_details.findOne(
            {
                cardholder_id: cardDetails.cardholder_id,
            },
            {
                wallet_id: 1,
                cardholder_id: 1,
                wallets_details: {
                    $elemMatch: {
                        wallet_currency: "USD",
                    },
                },
            }
        ).lean();
        if (!wallet || wallet.wallets_details.length === 0) {
            throw new BadRequestError("USD wallet not found");
        }
        const selectedWallet = wallet.wallets_details[0];
        if (selectedWallet?.wallet_status !== "ACTIVE") {
            throw new BadRequestError("USD wallet is inactive");
        }
        const accountBalance = Number(selectedWallet?.account_balance!.toString());
        const holdingAmount = Number(selectedWallet?.holding_amount!.toString());
        const availableBalance = accountBalance - holdingAmount;
        const transactionAmount = Number(amount);
        if (availableBalance < transactionAmount) {
            throw new BadRequestError("Insufficient available balance");
        }
        // xxxxxxxxxxxxxxxxxxxxxxxxxx \\

        // Initiate Card Transaction
        const initiateCardTransactionResult = await initiateCardTransaction(wallet.wallet_id, selectedWallet, cardDetails,
            {
                transaction_type: transactionType as
                    | "PURCHASE"
                    | "WITHDRAWAL"
                    | "REFUND",
                authorization_type: authorizationType as
                    | "HOLD"
                    | "IMMEDIATE",
                amount: Number(amount),
                merchant_name: merchantName,
                merchant_category: merchantCategory,
                merchant_country: merchantCountry,
                remarks: null,
            }
        );

        if (initiateCardTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Card transaction service failed")
        }

        if (authorizationType === "HOLD") {
            const maskCardNumber = (cardNumber: string): string => {
                return `**** **** **** ${cardNumber.slice(-4)}`;
            };
            const maskedCardNumber = maskCardNumber(initiateCardTransactionResult?.data?.cardNumber)

            // Get Cardholder Email
            const cardholderDetails = await user_details.findOne({ cardholder_id: cardDetails.cardholder_id }).select("email full_name business_id program_id subagent_code").lean();
            if (!cardholderDetails?.email) {
                throw new NotFoundError("Cardholder email not found");
            }

            // Get Dashboard
            const dashboardName = requestSession?.sessiondata?.dashboardName || "BMA"
            if (!dashboardName) {
                throw new UnauthenticatedError("Unauthenticated session detected");
            }

            const jwtSecretKey = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"
            // Create Card Transaction Auth Token
            const approveToken = jwt.sign(
                {
                    userId: cardDetails?.cardholder_id,
                    userName: cardholderDetails?.full_name || "Cardholder",
                    cardholderEmail: cardholderDetails?.email,
                    action: "APPROVE",
                    transactionId: initiateCardTransactionResult?.data?.transactionId,
                    maskedCardNumber: maskedCardNumber
                },
                jwtSecretKey,
                {
                    expiresIn: "2m",
                }
            );
            const rejectToken = jwt.sign(
                {
                    userId: cardDetails?.cardholder_id,
                    userName: cardholderDetails?.full_name || "Cardholder",
                    cardholderEmail: cardholderDetails?.email,
                    action: "REJECT",
                    transactionId: initiateCardTransactionResult?.data?.transactionId,
                    maskedCardNumber: maskedCardNumber
                },
                jwtSecretKey,
                {
                    expiresIn: "2m",
                }
            );

            // Backend webhook URLs
            const approveUrl = `${requestSession?.sessiondata?.baseUrl}/api/v1/public/card/cardTransactionAuthorizationWebhook?token=${encodeURIComponent(approveToken)}`;
            const rejectUrl = `${requestSession?.sessiondata?.baseUrl}/api/v1/public/card/cardTransactionAuthorizationWebhook?token=${encodeURIComponent(rejectToken)}`;

            // Format authorization expiry date
            const formattedExpiry = initiateCardTransactionResult?.data?.authorizationExpiresAt.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "medium",
                timeZone: "Asia/Kolkata",
            });

            // Generate email template
            const emailTemplate = generateEmailTemplate(
                "CARD_TRANSACTION_AUTHORIZATION",
                {
                    userId: cardDetails?.cardholder_id,
                    userName: cardholderDetails?.full_name || "Cardholder",
                    dashboardName: dashboardName,
                    cardholderEmail: cardholderDetails?.email,
                    transactionId: initiateCardTransactionResult?.data?.transactionId,
                    maskedCardNumber: maskedCardNumber,
                    authorizationExpiresAt: formattedExpiry,
                    merchantName: initiateCardTransactionResult?.data?.merchantName,
                    transactionCurrency: "USD",
                    transactionAmount: amount,
                    approveUrl,
                    rejectUrl
                }
            );

            const toEmail: string = cardholderDetails?.email
            const sendEmail: string = fromEmail
            const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
            // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
            const gmailMailServiceResponse = await gmailSendService(mainConfig)

            if (gmailMailServiceResponse?.status !== "SUCCESS") {
                return { status: "SUCCESS", message: "Card transaction successful - but failed to send authorization email", data: initiateCardTransactionResult?.data }
            }
            else {
                return { status: "SUCCESS", message: "Card transaction successful - authorization email sent to cardholder email", data: initiateCardTransactionResult?.data }
            }
        }
        else {
            return { status: "SUCCESS", message: "Card transaction successful", data: initiateCardTransactionResult?.data }
        }
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "CreateCardTransactionService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CreateCardTransactionService facing issue`, sanitizedError);
    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


// --------------------------------- Card Transaction Settlement Webhook --------------------------------- \\
interface CardAuthorizationJwtPayload {
    userId: string;
    userName: string;
    cardholderEmail: string;
    action: "APPROVE" | "REJECT";
    transactionId: string;
    maskedCardNumber: string;
    iat: number;
    exp: number;
}
export const cardTransactionAuthorizationWebhookService = async (aesDecryptedQueryData: Record<string, string> | undefined) => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid request");
        }

        // Verify JWT
        const token = aesDecryptedQueryData.token;
        if (!token) {
            throw new BadRequestError("Authorization token missing");
        }

        const jwtSecret = process.env.JWT_SECRET_KEY as string;

        const decoded = jwt.verify(
            token,
            jwtSecret
        ) as CardAuthorizationJwtPayload;

        // Validate Action
        if (!["APPROVE", "REJECT"].includes(decoded.action)) {
            throw new BadRequestError("Invalid authorization action");
        }

        // Find Transaction
        const transaction = await user_card_transactions.findOne({ transaction_id: decoded.transactionId }).lean();

        if (!transaction) {
            throw new NotFoundError("Card transaction not found");
        }

        // Check if the transaction is already processed
        if (transaction.authorization_status !== "PENDING") {
            throw new ServiceError(`Transaction already ${transaction.authorization_status.toLowerCase()}`);
        }

        // Check if the transaction authorization is expired
        if (transaction.authorization_expires_at && new Date() > transaction.authorization_expires_at) {
            throw new ServiceError("Authorization request has expired");
        }

        // Card Transaction Settlement Mongodb Transaction
        const cardTransactionSettlementResult = await cardTransactionSettlementTransaction(
            decoded,
            transaction
        );

        if (cardTransactionSettlementResult.status !== "SUCCESS") {
            throw new ServiceError(
                "Failed to authorize transaction"
            );
        }

        return {
            status: "SUCCESS",
            message: decoded.action === "APPROVE" ? "Transaction approved successfully" : "Transaction rejected successfully",
            data: cardTransactionSettlementResult.data,
        };
    } catch (err) {
        const error = err as any;
        logger.error(error, { serviceName: "CardTransactionAuthorizationWebhookService", });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CardTransactionAuthorizationWebhookService failed`, sanitizedError);
    }
};
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\