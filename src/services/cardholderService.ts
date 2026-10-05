import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import logger from "../utils/logger.js";
import type { ParsedQs } from "qs";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { Types } from "mongoose";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import checkStringBody from "../utils/checkStringBody.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import userDetailsValidationSchema from "../validations/userDetailsValidation.js";
import z from "zod";
import userSignUpTransaction from "../mongoDbTransactions/userSignUpTransaction.js";
import { genSaltSync, hashSync } from "bcrypt-ts";
import type { userDetailsDocumentType } from "../types/schemaTypes.js";
import crypto from "crypto"

// ------------------------------------- GET CARDHOLDER LIST SERVICE -------------------------------------  \\
type userConfigurationsType = {
    businessId: string;
    programId: string;
    agentCode: string;
    subAgentCode: string;
}
export const getCardholderListService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");

        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body");
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email");
        }

        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access cardholder list");
        }

        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;
        if (userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list");
        }

        // Get page in request
        const page = checkStringQueryParams(aesDecryptedQueryData, "page");
        // Get page size in request
        const pageSize = checkStringQueryParams(aesDecryptedQueryData, "page_size");

        // Validate page
        if (!page) {
            throw new InvalidRequestBodyError("Page value not present in the request query")
        }
        const requestedPage = Number(page);
        if (!Number.isInteger(requestedPage) || requestedPage < 1) {
            throw new InvalidRequestQueryError("Page must be a valid integer greater than 0");
        }
        // Validate page size
        if (!pageSize) {
            throw new InvalidRequestBodyError("Page size value not present in the request query")
        }
        const requestedPageSize = Number(pageSize);
        if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1) {
            throw new InvalidRequestQueryError("Page size must be a valid integer greater than 0");
        }

        // Cardholder Query
        const query = {
            business_id: sessionBusinessId,
            program_id: sessionProgramId,
            agent_code: sessionAgentCode,
            subagent_code: { $ne: "01" },
        };

        // Get Total Matching Cardholders
        const totalCardholders = await user_details.countDocuments(query);

        // Calculate Pagination
        const totalPages = Math.max(1, Math.ceil(totalCardholders / requestedPageSize));
        const currentPage = Math.min(requestedPage, totalPages);
        const skip = (currentPage - 1) * requestedPageSize;

        // Get User Details
        const users = await user_details.find(query,
            {
                full_name: 1,
                business_name: 1,
                program_type: 1,
                email: 1,
                mobile_country_code: 1,
                mobile_country_name: 1,
                phone_number: 1,
                date_of_birth: 1,
                gender: 1,
                kyc_status: 1,
                cardholder_id: 1,
                status: 1,
                is_active: 1,
                is_email_verified: 1,
                is_2fa_enabled: 1,
                two_fa_type: 1,
                createdAt: 1
            }
        ).sort({ createdAt: -1 }).skip(skip).limit(requestedPageSize).lean();

        if (!Array.isArray(users) || users.length === 0) {
            throw new NotFoundError("Cardholder list not found");
        }

        return {
            status: "SUCCESS",
            data: {
                pagination: {
                    current_page: currentPage,
                    page_size: requestedPageSize,
                    total_records: totalCardholders,
                    total_pages: totalPages,
                    has_next_page: currentPage * requestedPageSize < totalCardholders,
                    has_previous_page: currentPage > 1,
                },
                cardholders: users,
            },
            message: "Cardholder lists fetched",
        };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardholderListService",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(
            `GetCardholderListService facing issue`, sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- GET CARDHOLDER DETALS SERVICE -------------------------------------  \\
export const getCardholderDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType, cardholderId?: string): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check Cardholder Id
        if (!cardholderId) {
            throw new InvalidRequestParamsError("Cardholder not present in the request params");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email")
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access cardholder details")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder details")
        }

        const cardholderObjectId = new Types.ObjectId(cardholderId)

        // Get user details
        const usersDetails = await user_details.findOne(
            {
                cardholder_id: cardholderObjectId,
                business_id: sessionBusinessId,
                program_id: sessionProgramId,
                agent_code: sessionAgentCode,
                subagent_code: { $ne: "01" }
            },
            {
                full_name: 1,
                business_name: 1,
                program_type: 1,
                email: 1,
                mobile_country_code: 1,
                mobile_country_name: 1,
                phone_number: 1,
                date_of_birth: 1,
                gender: 1,
                kyc_status: 1,
                cardholder_id: 1,
                status: 1,
                is_active: 1,
                is_email_verified: 1,
                is_2fa_enabled: 1,
                two_fa_type: 1
            }
        ).lean();
        if (!usersDetails) {
            throw new NotFoundError("Cardholder details not found")
        }

        return { status: "SUCCESS", data: usersDetails, message: "Cardholder details fetched" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardholderDetailsService",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(
            `GetCardholderDetailsService facing issue`, sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- ADD CARDHOLDER SERVICE -------------------------------------  \\
const generateRandomPassword = (length = 16): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const special = "!@#$%^&*";

    const allCharacters = uppercase + lowercase + digits + special;

    const getRandomCharacter = (characters: string): string => {
        return characters[crypto.randomInt(0, characters.length)]!;
    };

    // Guarantee at least one character from each required category
    const passwordCharacters = [
        getRandomCharacter(uppercase),
        getRandomCharacter(lowercase),
        getRandomCharacter(digits),
        getRandomCharacter(special),
    ];

    // Fill remaining characters
    for (let i = passwordCharacters.length; i < length; i++) {
        passwordCharacters.push(getRandomCharacter(allCharacters));
    }

    // Cryptographically secure shuffle
    for (let i = passwordCharacters.length - 1; i > 0; i--) {
        const randomIndex = crypto.randomInt(0, i + 1);
        [passwordCharacters[i], passwordCharacters[randomIndex]] = [
            passwordCharacters[randomIndex]!,
            passwordCharacters[i]!,
        ];
    }

    return passwordCharacters.join("");
};

export const addCardholderService = async (req: Request, res: Response, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== req.session?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email")
        }
        if (req.session?.userType !== "ADMIN" && req.session?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access cardholder details")
        }
        const sessionBusinessId = req.session?.userConfiguration?.businessId
        const sessionProgramId = req.session?.userConfiguration?.programId
        const sessionAgentCode = req.session?.userConfiguration?.agentCode
        const sessionSubAgentCode = req.session?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder details")
        }

        // Get Business Details
        const sessionProgramType = req.session?.userConfiguration?.programType
        const sessionBusinessName = req.session?.userConfiguration?.businessName
        const sessionBusinessType = "EXISTING"

        // Check email present in request body
        const cardholderEmail: string | null = checkStringBody(aesDecryptedBodyData, "email");
        if (!cardholderEmail) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        const cardholderDetails = {
            full_name: aesDecryptedBodyData.full_name,
            program_type: sessionProgramType,
            business_name: sessionBusinessName,
            business_type: sessionBusinessType,
            email: cardholderEmail,
            password: generateRandomPassword(16),
            mobile_country_code: aesDecryptedBodyData?.mobile_country_code,
            mobile_country_name: aesDecryptedBodyData?.mobile_country_name,
            phone_number: aesDecryptedBodyData?.phone_number,
            date_of_birth: (aesDecryptedBodyData?.date_of_birth),
            gender: aesDecryptedBodyData?.gender,
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userDetailsValidationSchema>> = userDetailsValidationSchema.safeParse(cardholderDetails);
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

        // Check User Exist
        const cardholderEmailExists = await user_details.exists({
            email: validationResult.data.email
        });
        if (cardholderEmailExists) {
            throw new ServiceError("Cardholder with this email already exists");
        }

        // Check Business Name Exist
        const businessNameExist = await user_details.exists({
            business_name: validationResult.data.business_name
        });
        if (!businessNameExist) {
            throw new ServiceError("Business name does not exist in the system. Please check with your administrator.");
        }

        // Check primary user (admin) exist and program type
        const primaryUser = await user_details.findOne({
            business_name: validationResult.data.business_name,
            agent_code: "01",
            subagent_code: "01"
        }).select("program_type business_id").lean();
        const primaryUserNetwork = primaryUser?.program_type === "MASTER" ? "Master_Network" : "Visa_Network"
        // Check program type
        if (primaryUser?.program_type && primaryUser?.program_type !== validationResult?.data?.program_type) {
            throw new ServiceError(`${validationResult?.data?.business_name} is registered for ${primaryUserNetwork}. You can either use ${primaryUserNetwork} or register with different business name`)
        }

        // HashPassword
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(validationResult.data.password as string, salt);

        // Remove password from aesDecryptedBodyData
        const { password, ...restBody } = validationResult?.data;

        // Program ID
        const programId: "MBMA010" | "VBMA010" = validationResult.data.program_type === "MASTER" ? "MBMA010" : "VBMA010";

        const document: userDetailsDocumentType = {
            full_name: validationResult.data.full_name,
            business_name: validationResult.data.business_name,
            email: validationResult.data.email,
            phone_number: validationResult.data.phone_number,
            mobile_country_code: validationResult.data.mobile_country_code,
            mobile_country_name: validationResult.data.mobile_country_name,
            gender: validationResult.data.gender,
            date_of_birth: validationResult.data.date_of_birth,

            password: hashedPassword,

            agent_code: "01",
            subagent_code: primaryUser ? "02" : "01",

            business_id: primaryUser ? primaryUser?.business_id : `${validationResult.data.business_name}/01/${crypto.randomUUID()}`,
            program_id: programId,

            program_type: validationResult.data.program_type,

            is_admin: primaryUser ? "N" : "Y"
        }

        // Sign Up MongoDb Transaction
        const signUpTransaciotnResponse = await userSignUpTransaction(req, res, document);
        if (signUpTransaciotnResponse?.status?.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("User sign up service facing issue. Sign Up failed")
        }
        const insertedData = signUpTransaciotnResponse?.data;

        return { status: "SUCCESS", message: "Document inserted successfully", data: {} }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "AddCardholderService",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(`AddCardholderService facing issue`, sanitizedError);
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\