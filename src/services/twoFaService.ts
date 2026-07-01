import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import dotenv from "dotenv"
import logger from "../utils/logger.js";
import { gmailSendService } from "./gmailSendService.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import checkStringBody from "../utils/checkStringBody.js";
import type { userDetailsSchemaTypes } from "../types/schemaTypes.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import type { Schema } from "mongoose";
import { generateVerificationCodeService } from "./generateVerificationCodeService.js";
import generateEmailTemplate from "../utils/generateEmailTemplate.js";
import speakeasy, { type TotpVerifyOptions } from "speakeasy";
import QRCode from "qrcode";
import userEmailValidationSchema from "../validations/userEmailValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import destroySession from "../utils/destroySession.js";

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"

// SEND EMAIL SERVICE
export const sendVerificationEmailService = async (req: Request, res: Response,  userMail: string): Promise<successResponseJson | failedResponseJson> => {
    try {
        // Check if collection exist in MongoDB
        const isCollectionPresent1 = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent1.status !== "SUCCESS") {
            throw new NotFoundError("User_details collection does not exist in MongoDB");
        }

        if (!userMail) {
            throw new BadRequestError("Email not found in the request")
        }

        // Get user from DB
        const checkUserExistInDB = async (): Promise<userDetailsSchemaTypes | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findOne({ email: userMail });
            return userExistResponse;
        }
        const userDetails: userDetailsSchemaTypes | null = await checkUserExistInDB();

        // Check user exist in DB
        if (!userDetails) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User does not exist")
        }

        // Check collection exist in Mongo DB
        const isCollectionPresent2 = await checkMongoDbCollectionExist("user_meta_details");
        if (isCollectionPresent2.status !== "SUCCESS") {
            throw new NotFoundError("User_meta_details collection does not exist in MongoDB");
        }

        // Generate verificaiton code and its expiry time
        const verificationData = await generateVerificationCodeService();
        // HashVerification code
        const salt = genSaltSync(10);
        const hashedVerificationCode = hashSync(verificationData.verificationCode as string, salt);

        // Generate email template
        const userName = userDetails?.full_name || "User"
        const dashboardName = req.session.sessiondata?.dashboardName || "BMA"
        const emailTemplate = generateEmailTemplate(
            "EMAIL_VERIFICATION_CODE",
            {
                verificationCode: verificationData.verificationCode,
                userName: userName,
                dashboardName: dashboardName
            }
        );

        const toEmail: string = userMail
        const sendEmail: string = fromEmail
        const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
        // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
        const gmailMailServiceResponse = await gmailSendService(mainConfig)

        if (gmailMailServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("GmailSendService is facing error")
        }

        const userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
            { user_id: userDetails._id },
            { verification_code: hashedVerificationCode, verification_code_expires_at: verificationData.expiresAt },
            { upsert: true, new: true }
        )
        if (userMetaDetailsDoc) {
            return { status: "SUCCESS", data: gmailMailServiceResponse?.id, message: "Email send using service" }
        }
        else {
            return { status: "BAD_REQUEST", message: "Failed to send email using service" }
        }
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
        throw new ServiceUnavailableError("SendEmailService is unavailbale as facing unknown issue.", error)
    }
}

// VERIFY EMAIL SERVICE
export const verifyEmailService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
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
        if (userEmail !== requestSession?.userEmail) {
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

        const userId: unknown = requestSession?.userId;
        // Get verification code and expiry from the user meta details data base
        const verificationDataDoc = await user_meta_details.findOne(
            { user_id: userId as Schema.Types.ObjectId }
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
                { user_id: userId as Schema.Types.ObjectId },
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
        const updatedUserDetails = await user_details.findByIdAndUpdate(userId as Schema.Types.ObjectId, { is_email_verified: "Y", status: "VERIFIED" }, { new: true }) as userDetailsSchemaTypes;
        if (!updatedUserDetails) {
            throw new ServiceError("User email verification status update service is facing issue");
        }

        // Optional: clear verification code after successful verification
        await user_meta_details.updateOne(
            { user_id: userId as Schema.Types.ObjectId },
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
            serviceName: "VerifyEmailService",
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
        throw new ServiceUnavailableError("VerifyEmailService is unavailbale as facing unknown issue.", error)
    }
}

// SEND 2FA VERIFICATION CODE SERVICE
export const send2FaCodeService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }
        // Check email present in request body
        const userEmail: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!userEmail) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }
        // Check code type present in request body
        const codeType: string | null = checkStringBody(aesDecryptedBodyData, "code_type")
        if (!codeType) {
            throw new InvalidRequestBodyError("Code type not present in the request body");
        }

        // Check user mail with session mail
        if (userEmail !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected");
        }

        // if (codeType !== "EMAIL-OTP" && codeType !== "TOTP" && codeType !== "SMS_OTP") {
        if (codeType !== "EMAIL-OTP" && codeType !== "TOTP") {
            throw new InvalidRequestBodyError("Invalid 'code_type' parameter or not a string - 'code_type' can be [EMAL-OTP | TOPT | SMS_OTP]")
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

        // Get user-id from session
        const userId: unknown = requestSession?.userId;

        // Generate verificaiton code and its expiry time
        const verificationData = await generateVerificationCodeService();
        // HashVerification code
        const salt = genSaltSync(10);
        const hashedVerificationCode = hashSync(verificationData.verificationCode as string, salt);
        let secretKey: string;

        // ====================================== TOTP ====================================== \\
        if (codeType === "TOTP") {
            secretKey = speakeasy.generateSecret({ length: 20 }).base32;
            const issuer = requestSession?.sessiondata?.dashboardName;
            const account = requestSession?.userEmail;

            const otpauthUrl = speakeasy.otpauthURL({
                secret: secretKey,
                label: `${issuer}:${account}`,
                issuer: issuer,
                encoding: "base32",
                algorithm: "sha1",
            });
            // Generate QR Code as Base64 Data URL
            const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

            // Update user details for 2FA email
            const updatedUserDetailsDoc = await user_details.findByIdAndUpdate(
                userId,
                {
                    is_2fa_enabled: "Y",
                    two_fa_type: "TOTP",
                    authenticator_secret: secretKey,
                },
                {
                    new: true,
                    runValidators: true
                }
            );
            if (!updatedUserDetailsDoc) {
                throw new ServiceError("Failed to update two factor methods for user details.")
            }

            return { status: "SUCCESS", data: { secretKey: secretKey, qrCodeUrl: qrCodeDataUrl }, message: "Authenticator configuration generated" }
        }
        // ===================================== XXXXXXXXXXXXXXXXXXXXXXX ===================================== \\

        // ====================================== EMAIL-OTP ====================================== \\
        // Update user details for 2FA email
        const updatedUserDetailsDoc = await user_details.findByIdAndUpdate(
            userId,
            {
                is_2fa_enabled: "Y",
                two_fa_type: "EMAIL-OTP"
            },
            {
                new: true,
                runValidators: true
            }
        );
        if (!updatedUserDetailsDoc) {
            throw new ServiceError("Failed to update two factor methods for user details.")
        }

        // Generate email template
        const userName = requestSession?.userName || "User"
        const dashboardName = requestSession.sessiondata?.dashboardName || "BMA"
        const emailTemplate = generateEmailTemplate(
            "TWO_FACTOR_AUTH_CODE",
            {
                verificationCode: verificationData.verificationCode,
                userName: userName,
                dashboardName: dashboardName
            }
        );

        const toEmail: string = userEmail
        const sendEmail: string = fromEmail
        const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
        // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
        const gmailMailServiceResponse = await gmailSendService(mainConfig)

        if (gmailMailServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("GmailSendService is facing error")
        }

        // Insert user meta details
        const userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
            { user_id: userId as Schema.Types.ObjectId },
            { verification_code: hashedVerificationCode, verification_code_expires_at: verificationData.expiresAt },
            { upsert: true, new: true }
        )

        // Check if meta user data updated
        if (!userMetaDetailsDoc) {
            throw new ServiceError("Failed to update user meta details");
        }

        return { status: "SUCCESS", data: gmailMailServiceResponse?.id, message: "Email send using service" }
        // ===================================== XXXXXXXXXXXXXXXXXXXXXXX ===================================== \\
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "VerifyEmailService",
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
        throw new ServiceUnavailableError("VerifyEmailService is unavailbale as facing unknown issue.", error)
    }
}

// VERIFY 2 FA CODE SERVICE
export const verify2FaCodeService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
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
            throw new InvalidRequestBodyError("Code not present in the request body");
        }

        // Check code type present in request body
        const codeType: string | null = checkStringBody(aesDecryptedBodyData, "code_type")
        if (!codeType) {
            throw new InvalidRequestBodyError("Code type not present in the request body");
        }

        // Check user mail with session mail
        if (userEmail !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected");
        }

        // if (codeType !== "EMAIL-OTP" && codeType !== "TOTP" && codeType !== "SMS_OTP") {
        if (codeType !== "EMAIL-OTP" && codeType !== "TOTP") {
            throw new InvalidRequestBodyError("Invalid 'code_type' parameter or not a string - 'code_type' can be [EMAL-OTP | TOPT | SMS_OTP]")
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

        const userId: unknown = requestSession?.userId;
        // Get user details
        const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ _id: userId as Schema.Types.ObjectId });
        // Check 2FA type
        // if (userDetailsDoc?.two_fa_type !== "EMAIL-OTP" && userDetailsDoc?.two_fa_type !== "TOTP" && userDetailsDoc?.two_fa_type !== "SMS-OTP") {
        if (userDetailsDoc?.two_fa_type !== "EMAIL-OTP" && userDetailsDoc?.two_fa_type !== "TOTP") {
            throw new ServiceError("Email not in the valid state for 2 factor authentication using email - 2fa type not set or invalid")
        }
        if (!userDetailsDoc?.is_2fa_enabled) {
            throw new ServiceError("Email not in the valid state for 2 factor authentication using email - 2fa not enabled")
        }

        // ====================================== TOTP ====================================== \\
        if (codeType === "TOTP") {
            // Check authenticator secret in DB
            if (!userDetailsDoc?.authenticator_secret) {
                throw new ServiceError("Email not in the valid state for 2 factor authentication using authenticator - 2fa not configured for authenticator")
            }

            const time = Math.floor(Date.now() / 1000);

            const codeVerificationOptions: TotpVerifyOptions = {
                secret: userDetailsDoc?.authenticator_secret as string,
                encoding: "base32",
                token: verificationCode,
                // time,
                window: 2
            };

            const isValid = speakeasy.totp.verify(codeVerificationOptions);
            if (!isValid) {
                throw new ServiceError("2Fa auth code verificaiton failed");
            }
        }
        // ===================================== XXXXXXXXXXXXXXXX ===================================== \\
        // ====================================== TOTP ====================================== \\
        else if (codeType === "EMAIL-OTP") {
            // Get verification code and expiry from the user meta details data base
            const twoFaVerificationDataDoc = await user_meta_details.findOne(
                { user_id: userId as Schema.Types.ObjectId }
            ).select("verification_code verification_code_expires_at");
            if (!twoFaVerificationDataDoc?.verification_code || !twoFaVerificationDataDoc?.verification_code_expires_at) {
                throw new ServiceError("VerifiEmailService is facing issue - email not in the correct state for two factor auth verification, 2fa configuration not found")
            }

            // Check verification code expiry
            const currentTime = new Date();
            const verificationCodeExpiryTime = new Date(
                twoFaVerificationDataDoc.verification_code_expires_at
            );

            if (currentTime > verificationCodeExpiryTime) {
                // Optional: clear expired verification data
                await user_meta_details.updateOne(
                    { user_id: userId as Schema.Types.ObjectId },
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
                twoFaVerificationDataDoc.verification_code
            );
            if (!isVerificationCodeValid) {
                throw new ServiceError("Invalid verification code");
            }
        }

        // Update the email verified status in DB
        const updatedUserDetails = await user_details.findByIdAndUpdate(userId as Schema.Types.ObjectId, { is_email_verified: "Y", status: "VERIFIED" }, { new: true }) as userDetailsSchemaTypes;
        if (!updatedUserDetails) {
            throw new ServiceError("User email verification status update service is facing issue");
        }

        // Optional: clear verification code after successful verification
        await user_meta_details.updateOne(
            { user_id: userId as Schema.Types.ObjectId },
            {
                $unset: {
                    verification_code: "",
                    verification_code_expires_at: ""
                }
            }
        );

        // Set verified 2fa status in session
        requestSession.is2faVerified = true;

        return {
            status: "SUCCESS",
            message: "Two factor auth code verified successfully"
        };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "Verify2FaCodeService",
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
        throw new ServiceUnavailableError("Verify2FaCodeService is unavailbale as facing unknown issue.", error)
    }
}

// SEND RESET PASSWORD VERIFICATION CODE SERVICE
export const sendResetPasswordCodeService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }
        // Check email present in request body
        const userEmail: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!userEmail) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userEmailValidationSchema>> = userEmailValidationSchema.safeParse(userEmail);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
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

        // Get the user details
        const userDetails = await user_details.findOne({
            email: userEmail?.trim()
        });
        if (!userDetails) {
            throw new NotFoundError("User with the provided email does not exist");
        }

        const userId: unknown = userDetails._id;
        // Generate verificaiton code and its expiry time
        const verificationData = await generateVerificationCodeService();
        // HashVerification code
        const salt = genSaltSync(10);
        const hashedVerificationCode = hashSync(verificationData.verificationCode as string, salt);

        // Generate email template
        const userName = requestSession?.userName || "User"
        const dashboardName = requestSession.sessiondata?.dashboardName || "BMA"
        const emailTemplate = generateEmailTemplate(
            "FORGET_PASSWORD_CODE",
            {
                verificationCode: verificationData.verificationCode,
                userName: userName,
                dashboardName: dashboardName
            }
        );

        const toEmail: string = userEmail
        const sendEmail: string = fromEmail
        const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
        // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
        const gmailMailServiceResponse = await gmailSendService(mainConfig)

        if (gmailMailServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("GmailSendService is facing error")
        }

        // Insert user meta details
        const userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
            { user_id: userId as Schema.Types.ObjectId },
            { verification_code: hashedVerificationCode, verification_code_expires_at: verificationData.expiresAt },
            { upsert: true, new: true }
        )

        // Check if meta user data updated
        if (!userMetaDetailsDoc) {
            throw new ServiceError("Failed to update user meta details");
        }

        return { status: "SUCCESS", data: gmailMailServiceResponse?.id, message: "Email send using service" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "VerifyEmailService",
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
        throw new ServiceUnavailableError("VerifyEmailService is unavailbale as facing unknown issue.", error)
    }
}

// VERIFY RESET PASSWORD CODE SERVICE
export const verifyResetPasswordCodeService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }
        // Check email present in request body
        const userEmail: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!userEmail) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userEmailValidationSchema>> = userEmailValidationSchema.safeParse(userEmail);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Check verificationCode present in request body
        const verificationCode: string | null = checkStringBody(aesDecryptedBodyData, "code")
        if (!verificationCode) {
            throw new InvalidRequestBodyError("Email not present in the request body");
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

        // Get the user details
        const userDetails = await user_details.findOne({
            email: userEmail?.trim()
        });
        if (!userDetails) {
            throw new NotFoundError("User with the provided email does not exist");
        }

        const userId: unknown = userDetails._id;
        // Get verification code and expiry from the user meta details data base
        const twoFaVerificationDataDoc = await user_meta_details.findOne(
            { user_id: userId as Schema.Types.ObjectId }
        ).select("verification_code verification_code_expires_at");
        if (!twoFaVerificationDataDoc?.verification_code || !twoFaVerificationDataDoc?.verification_code_expires_at) {
            throw new ServiceError("VerifiEmailService is facing issue - email not in the correct state for reset password code verification")
        }

        // Check verification code expiry
        const currentTime = new Date();
        const verificationCodeExpiryTime = new Date(
            twoFaVerificationDataDoc.verification_code_expires_at
        );

        if (currentTime > verificationCodeExpiryTime) {
            // Optional: clear expired verification data
            await user_meta_details.updateOne(
                { user_id: userId as Schema.Types.ObjectId },
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
            twoFaVerificationDataDoc.verification_code
        );
        if (!isVerificationCodeValid) {
            throw new ServiceError("Invalid verification code");
        }

        // Update the email verified status in DB
        const updatedUserDetails = await user_details.findByIdAndUpdate(userId as Schema.Types.ObjectId, { is_email_verified: "Y", status: "VERIFIED" }, { new: true }) as userDetailsSchemaTypes;
        if (!updatedUserDetails) {
            throw new ServiceError("User email verification status update service is facing issue");
        }

        // Optional: clear verification code after successful verification
        await user_meta_details.updateOne(
            { user_id: userId as Schema.Types.ObjectId },
            {
                $unset: {
                    verification_code: "",
                    verification_code_expires_at: ""
                }
            }
        );

        return {
            status: "SUCCESS",
            message: "Two factor auth code verified successfully"
        };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "VerifyResetPasswordCodeService",
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
        throw new ServiceUnavailableError("VerifyResetPasswordCodeService is unavailbale as facing unknown issue.", error)
    }
}