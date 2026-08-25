import type { Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import logger from "../utils/logger.js";
import type { ParsedQs } from "qs";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import { beneficiariesBankDetailsModel as beneficiaries_bank_details } from "../models/beneficiaries_bank_details.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import addBeneficiaryBankDetailsValidationSchema from "../validations/addBeneficiaryBankDetailsValidation.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

type userConfigurationsType = {
    businessId: string;
    programId: string;
    agentCode: string;
    subAgentCode: string;
}

// ------------------------------------- GET BENEFICIERIES LIST SERVICE -------------------------------------  \\
export const getBeneficiariesListService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {

        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exists
        const isCollectionPresent = await checkMongoDbCollectionExist("beneficiaries_bank_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Beneficiaries collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");

        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email");
        }

        if (
            requestSession?.userType !== "ADMIN" &&
            requestSession?.userType !== "MASTER_ADMIN"
        ) {
            throw new ForbiddenError("Not authorized to access beneficiaries list");
        }

        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;

        if (
            userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError(
                "User configuration is not valid to access beneficiaries list"
            );
        }

        // Fetch beneficiaries
        const beneficiaries = await beneficiaries_bank_details.find({},
            {
                account_number: 1,
                account_holder_name: 1,
                swift_code: 1,
                iban_code: 1,
                bank_name: 1,
                is_verified: 1
            }
        ).lean();

        if (beneficiaries.length === 0) {
            throw new NotFoundError("No beneficiaries found");
        }

        return {
            status: "SUCCESS",
            data: beneficiaries,
            message: "Beneficiaries list fetched successfully"
        };

    } catch (err) {

        const error = err as any;
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetBeneficiariesListService"
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `GetBeneficiariesListService facing issue`,
            sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- GET BENEFICIARY DETALS SERVICE -------------------------------------  \\
export const getBeneficiaryDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType, beneficiaryId?: string): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exists in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("beneficiaries_bank_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Beneficiaries collection does not exist in MongoDB");
        }

        // Check Beneficiary Id Present
        if (!beneficiaryId) {
            throw new InvalidRequestParamsError("Account number not present in request params");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");

        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email");
        }

        if (
            requestSession?.userType !== "ADMIN" &&
            requestSession?.userType !== "MASTER_ADMIN"
        ) {
            throw new ForbiddenError("Not authorized to access beneficiary details");
        }

        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;

        if (
            userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError(
                "User configuration is not valid to access beneficiary details"
            );
        }

        // Fetch Beneficiary Details
        const beneficiaryDetails = await beneficiaries_bank_details.findOne(
            {
                _id: beneficiaryId
            },
            {
                account_number: 1,
                account_holder_name: 1,
                swift_code: 1,
                iban_code: 1,
                bank_name: 1,
                is_verified: 1
            }
        ).lean();

        if (!beneficiaryDetails) {
            throw new NotFoundError("Beneficiary details not found");
        }

        return { status: "SUCCESS", data: beneficiaryDetails, message: "Beneficiary details fetched successfully" };

    } catch (err) {

        const error = err as any;
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetBeneficiaryDetailsService"
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `GetBeneficiaryDetailsService facing issue`,
            sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- GET BENEFICIARY DETALS SERVICE -------------------------------------  \\
export const addBeneficiaryService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check if collection exists in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("beneficiaries_bank_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Beneficiaries collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");

        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }

        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof addBeneficiaryBankDetailsValidationSchema>> = addBeneficiaryBankDetailsValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Validated data
        const validatedData = validationResult.data;

        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access beneficiary details");
        }

        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;

        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access beneficiary details");
        }

        // Check user id
        const userId = requestSession?.userId;
        if (!userId) {
            throw new UnauthorizedError("Unauthorized session detected - user ID not found.");
        }

        // Check duplicate account number
        const existingBeneficiary = await beneficiaries_bank_details.exists({
            user_id: userId,
            account_number: validatedData.account_number
        });
        if (existingBeneficiary) {
            throw new ServiceError("Beneficiary with this account number already exists");
        }

        // Create beneficiary
        const beneficiary = await beneficiaries_bank_details.create({
            user_id: userId,
            account_holder_name: validatedData.account_holder_name,
            account_number: validatedData.account_number,
            account_currency: validatedData.account_currency as any,
            bank_name: validatedData.bank_name,
            swift_code: validatedData.swift_code,
            iban_code: validatedData.iban_code,
        });

        return { status: "SUCCESS", data: beneficiary, message: "Beneficiary added successfully" };

    } catch (err) {

        const error = err as any;
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "AddBeneficiaryService"
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `AddBeneficiaryService facing issue`,
            sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\