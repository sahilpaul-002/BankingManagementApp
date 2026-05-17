import type { Request, Response } from "express"
import type { successResponseJson } from "../types/responseJson.js"
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import { userKycDetailsModel as user_kyc_details } from "../models/user_kyc_details.js";
import type { Schema } from "mongoose";
import checkStringBody from "../utils/checkStringBody.js";
import uploadOnCloudinary from "../configs/claudinary.js";
import type { Types } from "mongoose";

// GET KYC SERVICE
export const getKycService = async (requestSession: Request["session"], res: Response, aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }

        // Check collection esistance
        const isCollectionPresent1 = await checkMongoDbCollectionExist("user_kyc_details");
        if (isCollectionPresent1.status !== "SUCCESS") {
            throw new NotFoundError("User_kyc_details collection does not exist in MongoDB");
        }

        // Get user id from session
        const userId: unknown = requestSession?.userId

        // Get user kyc details
        const userKycDetailsDoc = await user_kyc_details.findOne({
            user_id: userId as Schema.Types.ObjectId
        });
        if (!userKycDetailsDoc) {
            throw new NotFoundError("User kyc details not found")
        }

        return { status: "SUCCESS", data: userKycDetailsDoc, message: "User kyc details fetched" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetKycService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("GetKycService is unavailbale as facing unknown issue.", error)
    }
}

// GET KYC SERVICE
interface kycMulterFiles {
    poi_document?: Express.Multer.File[];
    poa_document?: Express.Multer.File[];
}

export const uploadKycService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }

        // Validate Request Body Fields
        const requiredFields = ["poi_number", "poa_number"] as const;
        const validatedData: Record<string, string> = {};
        for (const field of requiredFields) {
            const value = checkStringBody(aesDecryptedBodyData, field);

            if (!value) {
                throw new InvalidRequestBodyError(
                    `${field} not present in request body`
                );
            }

            validatedData[field] = value;
        }
        // Extract validated values
        const poiNumber = validatedData.poi_number;
        const poaNumber = validatedData.poa_number;

        // Validate Uploaded Files
        const files = req.files as kycMulterFiles;
        if (!files?.poi_document?.[0]) {
            throw new BadRequestError("POI document file is required");
        }
        if (!files?.poa_document?.[0]) {
            throw new BadRequestError("POA document file is required");
        }
        const poiDocumentFile = files.poi_document[0];
        const poaDocumentFile = files.poa_document[0];

        // Check collection existance
        const isCollectionPresent1 = await checkMongoDbCollectionExist("user_kyc_details");
        if (isCollectionPresent1.status !== "SUCCESS") {
            throw new NotFoundError("User_kyc_details collection does not exist in MongoDB");
        }

        // Get user id from session
        const userId: unknown = req.session?.userId

        // Check Existing KYC
        const existingKycDoc = await user_kyc_details.findOne({
            user_id: userId as Schema.Types.ObjectId,
        });
        if (existingKycDoc) {
            throw new ServiceError("KYC details already exist for this user");
        }

        // Upload Documents To Cloudinary
        const poiUploadResponse = await uploadOnCloudinary(
            poiDocumentFile,
            req.session?.sessiondata?.businessId as string,
            req.session?.sessiondata?.clientId as string,
            req.session?.sessiondata?.agentCode as string,
            req.session?.sessiondata?.subAgentCode as string,
            userId as string
        );
        if (poiUploadResponse?.status !== "SUCCESS") {
            throw new ServiceError("Failed to upload POI file in cloud service")
        }
        const poaUploadResponse = await uploadOnCloudinary(
            poaDocumentFile,
            req.session?.sessiondata?.businessId as string,
            req.session?.sessiondata?.clientId as string,
            req.session?.sessiondata?.agentCode as string,
            req.session?.sessiondata?.subAgentCode as string,
            userId as string
        );
        if (poiUploadResponse?.status !== "SUCCESS") {
            throw new ServiceError("Failed to upload POA file in cloud service")
        }

        // Create KYC Document
        const newKycDocumentResponse = await user_kyc_details.create({
            user_id: userId as Types.ObjectId,
            kyc_status: "IN-PROGRESS",
            poi_number: poiNumber as string,
            poa_number: poaNumber as string,
            poi_document: poiUploadResponse.secure_url,
            poa_document: poaUploadResponse.secure_url,
        });

        return { status: "SUCCESS", data: newKycDocumentResponse, message: "User kyc details fetched" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UploadKycService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("UploadKycService is unavailbale as facing unknown issue.", error)
    }
}