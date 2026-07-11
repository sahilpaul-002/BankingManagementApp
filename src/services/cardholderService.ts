import type { Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import logger from "../utils/logger.js";
import type { ParsedQs } from "qs";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import { userDetailsModel as user_details } from "../models/user_details.js";

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
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email")
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access cardholder list")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access cardholder list")
        }

        // Get user details
        const users = await user_details.find(
            {
                business_id: sessionBusinessId,
                program_id: sessionProgramId,
                agent_code: sessionAgentCode,
                subagent_code: { $ne: "01" },
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
        if (!users) {
            throw new NotFoundError("Cardholder list not found")
        }

        return { status: "SUCCESS", data: users, message: "Cardholder lists fetched" }
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

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(
            `GetCardholderListService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
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

        // Get user details
        const usersDetails = await user_details.findOne(
            {
                cardholder_id: cardholderId
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

        if (error instanceof AppErrorClass) {
            throw error
        }

        throw new ServiceError(
            `GetCardholderDetailsService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\