import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import { userKycDetailsModel as user_kyc_details } from "../models/user_kyc_details.js";
import type { Schema } from "mongoose";
import checkStringBody from "../utils/checkStringBody.js";
import uploadOnCloudinary from "../configs/claudinary.js";
import { Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv"
import generateEmailTemplate from "../utils/generateEmailTemplate.js";
import { gmailSendService } from "./gmailSendService.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import type { ParsedQs } from "qs";

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"
const bmaNotificationMail = process.env.BMA_EMAIL || "bma_notification@yopmail.com"

// ------------------------------------- GET KYC SERVICE ------------------------------------- \\
export const getKycService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
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
            throw error
        }
        throw new ServiceError(
            `GetKycService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- UPLOAD KYC DETAILS SERVICE ------------------------------------- \\
interface kycMulterFiles {
    poi_document?: Express.Multer.File[];
    poa_document?: Express.Multer.File[];
}

export const uploadKycService = async (req: Request, aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
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


        if (!existingKycDoc) {
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
            const newKycDoc = await user_kyc_details.create({
                user_id: userId as Types.ObjectId,
                kyc_status: "IN-PROGRESS",
                poi_number: poiNumber as string,
                poa_number: poaNumber as string,
                poi_document: poiUploadResponse.secure_url,
                poa_document: poaUploadResponse.secure_url,
                kyc_request_id: crypto.randomUUID()
            });

            if (!newKycDoc) {
                throw new ServiceError(
                    "Failed to add KYC details"
                );
            }

            return { status: "SUCCESS", data: newKycDoc, message: "User kyc details uploaded" }
        }
        else if (existingKycDoc?.kyc_status === "RFI") {
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
            const updatedKycDoc = await user_kyc_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId
                },
                {
                    kyc_status: "IN-PROGRESS",
                    poi_number: poiNumber as string,
                    poa_number: poaNumber as string,
                    poi_document: poiUploadResponse.secure_url,
                    poa_document: poaUploadResponse.secure_url,
                    kyc_request_id: crypto.randomUUID()
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedKycDoc) {
                throw new ServiceError(
                    "Failed to update RFI KYC details"
                );
            }

            return { status: "SUCCESS", data: updatedKycDoc, message: "User kyc details uploaded" }
        }
        else {
            throw new ServiceError("KYC details already exist for this user");
        }
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
            throw error
        }
        throw new ServiceError(
            `UploadKycService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- SEND KYC VERIFICATION MAIL SERVICE ------------------------------------- \\
export const sendKycVerificationMailService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }

        // Get user data from session
        const userEmail = requestSession?.userEmail
        if (!userEmail) {
            throw new UnauthenticatedError("Unauthenticated session detected");
        }
        const userId: unknown = requestSession?.userId
        if (!userId) {
            throw new UnauthenticatedError("Unauthenticated session detected");
        }
        const userName = requestSession?.userName || "User"
        if (!userName) {
            throw new UnauthenticatedError("Unauthenticated session detected");
        }
        const dashboardName = requestSession?.sessiondata?.dashboardName || "BMA"
        if (!dashboardName) {
            throw new UnauthenticatedError("Unauthenticated session detected");
        }

        // Get user details
        const userDetailsDoc = await user_details.findOne({
            _id: userId as Schema.Types.ObjectId
        })
        if (!userDetailsDoc) {
            throw new NotFoundError("User details not found");
        }
        // Get user kyc details
        const userKycDetailsDoc = await user_kyc_details.findOne({
            user_id: userId as Schema.Types.ObjectId
        });
        if (!userKycDetailsDoc) {
            throw new NotFoundError("User kyc details not found")
        }

        const jwtSecretKey = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"
        // Create Kyv Verification Approve Auth Token
        const approveToken = jwt.sign(
            {
                userId,
                userName,
                dashboardName,
                action: "APPROVE",
                kycRequestId: userKycDetailsDoc?.kyc_request_id
            },
            jwtSecretKey,
            {
                expiresIn: "2d",
            }
        );
        const rejectToken = jwt.sign(
            {
                userId,
                userName,
                dashboardName,
                action: "REJECT",
                kycRequestId: userKycDetailsDoc?.kyc_request_id
            },
            jwtSecretKey,
            {
                expiresIn: "2d",
            }
        );

        // Backend webhook URLs
        const approveUrl = `${requestSession?.sessiondata?.baseUrl}/api/v1/public/kyc/kycVerificationWebhook?token=${encodeURIComponent(approveToken)}`;
        const rejectUrl = `${requestSession?.sessiondata?.baseUrl}/api/v1/public/kyc/kycVerificationWebhook?token=${encodeURIComponent(rejectToken)}`;

        // Generate email template
        const poiDocumentUrl = userKycDetailsDoc?.poi_document
        const poaDocumentUrl = userKycDetailsDoc?.poa_document
        const emailTemplate = generateEmailTemplate(
            "KYC_VERIFICATION",
            {
                userId: userId as string,
                userName: userName,
                poiDocumentUrl,
                poaDocumentUrl,
                dashboardName: dashboardName,
                approveUrl,
                rejectUrl
            }
        );

        const toEmail: string = bmaNotificationMail
        const sendEmail: string = fromEmail
        const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
        // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
        const gmailMailServiceResponse = await gmailSendService(mainConfig)

        if (gmailMailServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("GmailSendService is facing error")
        }

        return { status: "SUCCESS", data: {}, message: "Kyc verificaiton email sent" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SendKycVerificationMailService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `SendKycVerificationMailService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- KYC VERIFICATION WEBHOOK SERVICE ------------------------------------- \\
interface kycVerificationJwtPayloadType extends JwtPayload {
    userId: string;
    userName: string;
    dashboardName: string;
    action: "APPROVE" | "REJECT";
    kycRequestId: string;
}

export const kycVerificationWebhookService = async (aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson | failedResponseJson | void> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid request query params data");
        }

        // Verify JWT kyc verification auth token
        const token = aesDecryptedQueryData.token;
        if (!token || typeof token !== "string") {
            throw new BadRequestError("Invalid or incomplete token in kyc verification webhook");
        }

        const jwtSecret = process.env.JWT_SECRET_KEY as string;
        const decoded = jwt.verify(token, jwtSecret) as kycVerificationJwtPayloadType

        // Verify token
        const currentKycDoc = await user_kyc_details.findOne({ user_id: decoded.userId });
        if (currentKycDoc?.kyc_request_id !== decoded?.kycRequestId) {
            // throw new ServiceError("Expired kyc verification link.")
            return {status: "SERVICE_ERROR", message: "Exipred verification link or RFI requested"}
        }

        let updatedStatus

        if (decoded.action === "APPROVE") {
            updatedStatus = "COMPLETED";

            // Update Kyc Status in DB
            const userDetailsDoc = await user_details.findOneAndUpdate(
                {
                    _id: decoded.userId,
                },
                {
                    kyc_status: updatedStatus,
                },
                {
                    new: true,
                }
            );
            if (!userDetailsDoc) {
                throw new ServiceError("Failed to update the user details for kyc status")
            }
            const userKycDetailsDoc = await user_kyc_details.findOneAndUpdate(
                {
                    user_id: decoded.userId,
                },
                {
                    kyc_status: updatedStatus,
                },
                {
                    new: true,
                }
            );
            if (!userKycDetailsDoc) {
                throw new ServiceError("Failed to update the user details for kyc status")
            }

            // =======================
            // Success mail to kyc user
            // =======================
            // Generate email template
            const emailTemplate = generateEmailTemplate(
                "KYC_ACCEPTED",
                {
                    userName: decoded?.userName,
                    dashboardName: decoded?.dashboardName,
                }
            );

            const toEmail: string = userDetailsDoc?.email;
            const sendEmail: string = fromEmail
            const mainConfig = { toEmail, sendEmail, dashboardName: decoded?.dashboardName, emailTemplate }
            // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
            const gmailMailServiceResponse1 = await gmailSendService(mainConfig)

            if (gmailMailServiceResponse1?.status !== "SUCCESS") {
                throw new ServiceError("GmailSendService is facing error")
            }


            // =======================
            // Success mail to BMA admin
            // =======================
            // Generate email template
            const adminUserName = "User"
            const emailTemplateAdmin = generateEmailTemplate(
                "KYC_ACCEPTED_ADMIN",
                {
                    userId: decoded?.userId,
                    userName: adminUserName,
                    dashboardName: decoded?.dashboardName,
                }
            );

            const toAdminEmail: string = bmaNotificationMail;
            const mainConfigAdmin = { toEmail: toAdminEmail, sendEmail, dashboardName: "BMA_Admin", emailTemplate: emailTemplateAdmin }
            // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
            const gmailMailServiceResponse2 = await gmailSendService(mainConfigAdmin)

            if (gmailMailServiceResponse2?.status !== "SUCCESS") {
                throw new ServiceError("GmailSendService is facing error")
            }

            return { status: "SUCCESS", data: "Kyc verification accepted", message: "Kyc verification email webhook send succesfully" }
        }
        else if (decoded.action === "REJECT") {
            updatedStatus = "RFI";

            // Update Kyc Status in DB
            const userDetailsDoc = await user_details.findOneAndUpdate(
                {
                    _id: decoded.userId,
                },
                {
                    kyc_status: updatedStatus,
                },
                {
                    new: true,
                }
            );
            if (!userDetailsDoc) {
                throw new ServiceError("Failed to update the user details for kyc status")
            }
            const userKycDetailsDoc = await user_kyc_details.findOneAndUpdate(
                {
                    user_id: decoded.userId,
                },
                {
                    kyc_status: updatedStatus,
                },
                {
                    new: true,
                }
            );
            if (!userKycDetailsDoc) {
                throw new ServiceError("Failed to update the user details for kyc status")
            }

            // Generate email template
            const emailTemplate = generateEmailTemplate(
                "KYC_REJECTED",
                {
                    userName: decoded?.userName,
                    dashboardName: decoded?.dashboardName,
                }
            );

            const toEmail: string = userDetailsDoc?.email;
            const sendEmail: string = fromEmail
            const mainConfig = { toEmail, sendEmail, dashboardName: decoded?.dashboardName, emailTemplate }
            // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
            const gmailMailServiceResponse = await gmailSendService(mainConfig)

            if (gmailMailServiceResponse?.status !== "SUCCESS") {
                throw new ServiceError("GmailSendService is facing error")
            }

            return { status: "SUCCESS", data: "Kyc verification rejected", message: "Kyc verification email webhook send succesfully" }
        }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetKycVerificationWebhookService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetKycVerificationWebhookService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\