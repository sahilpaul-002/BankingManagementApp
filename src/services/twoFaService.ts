import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { resendMailSendService } from "./resendMailService.js";
import dotenv from "dotenv"
import logger from "../utils/logger.js";
import { gmailSendService } from "./gmailSendService.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import checkStringBody from "../utils/checkStringBody.js";
import type { userDetailsSchemaTypes } from "../types/schemaTypes.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import destroySession from "../utils/destroySession.js";
import { compareSync } from "bcrypt-ts";

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"


// VERIFY EMAIL SERVICE
export const verifyEmailService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }
        // Check email present in request body
        const userEmail: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!userEmail) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check verificationCode present in request body
        const verificationCode: string | null = checkStringBody(aesDecryptedBodyData, "code")
        if (!verificationCode) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check user mail with session mail
        if (userEmail !== req.session?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent1 = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent1.status !== "SUCCESS") {
            throw new NotFoundError("User_details collection does not exist in MongoDB");
        }
        const isCollectionPresent2 = await checkMongoDbCollectionExist("user_meta_details");
        if (isCollectionPresent2.status !== "SUCCESS") {
            throw new NotFoundError("User_meta_details collection does not exist in MongoDB");
        }

        // Get user from DB
        const checkUserExistInDB = async (): Promise<userDetailsSchemaTypes | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findOne({ email: userEmail });
            return userExistResponse;
        }
        const userDetails: userDetailsSchemaTypes | null = await checkUserExistInDB();

        // Check user exist in DB
        if (!userDetails) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User does not exist")
        }

        // Get verification code and expiry from the user meta details data base
        const verificationDataDoc = await user_meta_details.findOne(
            { user_id: userDetails._id }
        ).select("verification_code verification_code_expires_at");
        if (!verificationDataDoc?.verification_code || !verificationDataDoc?.verification_code_expires_at) {
            throw new ServiceError("VerifiEmailService is facing issue - email not in the correct state for verification")
        }

        // Check verification code expiry
        const currentTime = new Date();
        const verificationCodeExpiryTime = new Date(
            verificationDataDoc.verification_code_expires_at
        );

        if (currentTime > verificationCodeExpiryTime) {

            // Optional: clear expired verification data
            await user_meta_details.updateOne(
                { user_id: userDetails._id },
                {
                    $unset: {
                        verification_code: "",
                        verification_code_expires_at: ""
                    }
                }
            );

            throw new ServiceError("Verification code expired");
        }

        // Compare verification code with hashed value
        const isVerificationCodeValid = await compareSync(
            verificationCode,
            verificationDataDoc.verification_code
        );
        if (!isVerificationCodeValid) {
            throw new ServiceError("Invalid verification code");
        }

        // Update the email verified status in DB
        const updatedUserDetails = await user_details.findByIdAndUpdate(userDetails._id, { is_email_verified: "Y", status: "VERIFIED" }, { new: true }) as userDetailsSchemaTypes;
        if (!updatedUserDetails) {
            throw new ServiceError("User email verification status update service is facing issue");
        }

        // Optional: clear verification code after successful verification
        await user_meta_details.updateOne(
            { user_id: userDetails._id },
            {
                $unset: {
                    verification_code: "",
                    verification_code_expires_at: ""
                }
            }
        );

        return {
            status: "SUCCESS",
            message: "Email verified successfully"
        };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GmailSendService",
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
        throw new ServiceUnavailableError("GmailSendService is unavailbale as facing unknown issue.", error)
    }
}

// SEND EMAIL SERVICE
export const sendEmailService = async (requestSession: Request["session"], userMail: string, type: string, emailTemplate: any): Promise<successResponseJson> => {
    try {
        const toEmail: string = userMail
        const sendEmail: string = fromEmail
        const dashboardName: string = requestSession?.sessiondata?.dashboardName || "BMA"
        const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
        // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
        const gmailMailServiceResponse = await gmailSendService(mainConfig)

        if (gmailMailServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("GmailSendService is facing error")
        }
        return { status: "SUCCESS", data: gmailMailServiceResponse?.id, message: "Email send using service" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GmailSendService",
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
        throw new ServiceUnavailableError("GmailSendService is unavailbale as facing unknown issue.", error)
    }
}