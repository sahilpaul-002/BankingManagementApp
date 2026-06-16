import type { Request, Response } from "express"
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userLoginValidationSchema from "../validations/userLoginValidation.js";
import type { userAddressDetailsSchemaTypes, userBankDetailsSchemaTypes, userDetailsSchemaTypes } from "../types/schemaTypes.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import destroySession from "../utils/destroySession.js";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import normalizeIp from "../utils/normalizeIp.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import type { sessionDataTypes, sessionItemsTypes } from "../types/sessionTypes.js";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import extractJwtTokenValue from "../utils/extractJwtTokenValue.js";
import generateJwtToken from "../utils/generateJwtToken.js";
import setResponseCookie from "../utils/setResponseCookie.js";
import checkStringBody from "../utils/checkStringBody.js";
import { getDnsConfigService } from "./configServices.js";
import type { ParsedQs } from "qs";
import userDetailsValidationSchema from "../validations/userDetailsValidation.js";
import logger from "../utils/logger.js";
import { generateVerificationCodeService } from "./generateVerificationCodeService.js";
import generateEmailTemplate from "../utils/generateEmailTemplate.js";
import { sendVerificationEmailService } from "./twoFaService.js";
import { userAddressDetailsModel as user_address_details } from "../models/user_addresses_details.js";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import { userOnboardingDetailsValidationSchema } from "../validations/userOnboardingDetailsValidation.js";
import type { Schema } from "mongoose";
import type { Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv"
import { gmailSendService } from "./gmailSendService.js";

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"
const bmaNotificationMail = process.env.BMA_EMAIL || "bma_notification@yopmail.com"

// ------------------------------------- USER SIGN UP SERVICE -------------------------------------  \\
export const userSignUpService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined) => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        if (!req.session || !req.session?.initiated || !req.session?.lastActivity || !req.session?.sessiondata || !req.session?.meta) {
            const getDnsConfigServiceResponse: Record<string, any> | undefined = await getDnsConfigService(req, aesDecryptedQueryData);

            if (getDnsConfigServiceResponse?.status !== "SUCCESS") {
                throw new ServiceError("getDnsConfigService facing isssue");
            }
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check password present in request body
        const userPassword: string | null = checkStringBody(aesDecryptedBodyData, "password")
        if (!userPassword) {
            throw new InvalidRequestBodyError("Password not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userDetailsValidationSchema>> = userDetailsValidationSchema.safeParse(aesDecryptedBodyData);
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

        // Get user from DB
        const checkUserExistInDB = async (): Promise<boolean | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findOne({ email: email });
            return userExistResponse !== null;
        }
        const userExistance: boolean | null = await checkUserExistInDB();

        // Check user exist in DB
        if (userExistance) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User already exists");
        }

        // HashPassword
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(userPassword as string, salt);

        // Remove password from aesDecryptedBodyData
        const { password, agent_code, subagent_code, program_id, business_id, client_id, ...restBody } = aesDecryptedBodyData;

        // Format document by adding the agent_code and subagent_code from session
        const document: object = {
            ...restBody,
            password: hashedPassword,
            agent_code: aesDecryptedBodyData?.agent_code || req.session?.sessiondata?.agentCode,
            subagent_code: aesDecryptedBodyData?.subagent_code || req.session?.sessiondata?.subAgentCode,
            program_id: aesDecryptedBodyData?.program_id || req.session?.sessiondata?.programId,
            business_id: aesDecryptedBodyData?.business_id || req.session?.sessiondata?.businessId,
            client_id: aesDecryptedBodyData?.client_id || req.session?.sessiondata?.clientId,
            // kyc_status: "PENDING",
            // is_admin: "N",
            // is_master_admin: "N",
            // "status": "DISABLED",
            // "is_active": "N",
            // "is_email_verified": "N",
            // "is_phone_verified": "N",
            // "is_2fa_enabled": "N",
            // "last_login_at": null
        };

        // Insert document in collection
        const insertedDocument = await user_details.create(document);

        // console.log("Document inserted: ", insertedDocument);
        return { status: "SUCCESS", message: "Document inserted successfully", data: insertedDocument }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserSignUpService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `UserSignUpService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- USER LOG IN SERVICE -------------------------------------  \\
export const userLoginService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined) => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }
        if (!req.session || !req.session?.initiated || !req.session?.lastActivity || !req.session?.sessiondata || !req.session?.meta) {
            const getDnsConfigServiceResponse: Record<string, any> | undefined = await getDnsConfigService(req, aesDecryptedQueryData);

            if (getDnsConfigServiceResponse?.status !== "SUCCESS") {
                throw new ServiceError("getDnsConfigService facing isssue");
            }
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent1 = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent1.status !== "SUCCESS") {
            throw new NotFoundError("User_details collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check password present in request body
        const password: string | null = checkStringBody(aesDecryptedBodyData, "password")
        if (!password) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userLoginValidationSchema>> = userLoginValidationSchema.safeParse(aesDecryptedBodyData);
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

        // Get user from DB
        const checkUserExistInDB = async (): Promise<userDetailsSchemaTypes | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findOne({ email: email });
            return userExistResponse;
        }
        const userDetails: userDetailsSchemaTypes | null = await checkUserExistInDB();

        // Check user exist in DB
        if (!userDetails) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User does not exist")
        }

        // Check user input password validity
        const isPasswordValid = compareSync(password, userDetails?.password);
        if (!isPasswordValid) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("Invalid credentials")
        }

        // Check user configuration
        if (userDetails.agent_code !== req.session?.sessiondata?.agentCode || userDetails.subagent_code !== req.session?.sessiondata?.subAgentCode || userDetails.program_id !== req.session?.sessiondata?.programId || userDetails.business_id !== req.session?.sessiondata?.businessId || userDetails.client_id !== req.session?.sessiondata?.clientId) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User configuration does not match")
        }

        const isCollectionPresent2 = await checkMongoDbCollectionExist("user_meta_details");
        if (isCollectionPresent2.status !== "SUCCESS") {
            throw new NotFoundError("User_meta_details collection does not exist in MongoDB");
        }

        // Update user status in DB if not already activated
        let updatedUserDetails: userDetailsSchemaTypes
        if (userDetails?.is_active === "N") {
            updatedUserDetails = await user_details.findByIdAndUpdate(userDetails._id, { is_active: "N", status: "ACTIVE" }, { new: true }) as userDetailsSchemaTypes;
        }
        else {
            updatedUserDetails = userDetails;
        }

        // Get the client IP address
        const getClientIP = (req: Request): string => {
            let ip =
                (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0]?.trim() : undefined) ||
                req.socket?.remoteAddress ||
                req.connection?.remoteAddress ||
                req.ip

            return normalizeIp(ip) as string;
        };

        const clientIp = getClientIP(req)

        // Get the device id from header
        const deviceId = req.headers['x-device-id'];

        let userMetaDetailsDoc;
        // Check user email verified
        if (userDetails.is_email_verified === "N") {
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

            // Send email verification code
            const sendEmailResponse = await sendVerificationEmailService(req.session, userDetails.email, "EMAIL_VERIFICATION", emailTemplate);
            if (sendEmailResponse?.status === "SUCCESS") {
                // Insert user meta details
                userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
                    { user_id: updatedUserDetails._id },
                    { device_id: deviceId, ip_address: clientIp, userAgent: req.headers["user-agent"], login_at: new Date(), verification_code: hashedVerificationCode, verification_code_expires_at: verificationData.expiresAt },
                    { upsert: true, new: true }
                )
            }
            else {
                // Insert user meta details
                userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
                    { user_id: updatedUserDetails._id },
                    { device_id: deviceId, ip_address: clientIp, userAgent: req.headers["user-agent"], login_at: new Date() },
                    { upsert: true, new: true }
                )
            }
        }
        else {
            // Insert user meta details
            userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
                { user_id: updatedUserDetails._id },
                { device_id: deviceId, ip_address: clientIp, userAgent: req.headers["user-agent"], login_at: new Date() },
                { upsert: true, new: true }
            )
        }

        // Check if meta user data updated
        if (!userMetaDetailsDoc) {
            throw new ServiceError("UserLoginService is facing issue - failed to update user meta details");
        }

        // Check if session is already valid, if yes then delete the old session and create a new session
        if (req.session.valid && req.session.userId === updatedUserDetails._id.toString()) {
            // Get sessiondata from session before destroying the session
            const sessionData: sessionDataTypes = req.session.sessiondata;
            const encryptionKey = req.session.encryptionKey
            const headerKeys = {
                publicKey: req.session.headerKeys?.publicKey as string,
                privateKey: req.session.headerKeys?.privateKey as string
            }
            const publicKey = req.session?.publicKey
            const privateKey = req.session?.privateKey

            // Regenerate a new session after destroying older session
            await new Promise<void>((resolve, reject) => {
                req.session.regenerate((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            });

            // INITIATE SESSION
            req.session.initiated = true;
            req.session.lastActivity = Date.now();

            // Restore the keys
            req.session.encryptionKey = encryptionKey as string;
            req.session.headerKeys = headerKeys as typeof headerKeys;
            req.session.publicKey = publicKey as string;
            req.session.privateKey = privateKey as string;


            // Set sessiondata in new session
            req.session.sessiondata = sessionData;
        }

        // Update session with userId and email
        req.session.userEmail = updatedUserDetails.email;
        req.session.userName = updatedUserDetails.full_name;
        req.session.userId = updatedUserDetails._id.toString();
        req.session.userType = updatedUserDetails.is_master_admin === "Y" ? "SUPERADMIN" : updatedUserDetails.is_admin === "Y" ? "ADMIN" : "USER";

        // Update the session validity
        req.session.valid = true;

        // Store client IP and device id in session meta
        req.session.meta = {
            ...req.session.meta,
            clientIp: clientIp as string,
            deviceId: deviceId as string,
        }

        // console.log("Session data after login: ", req.session);

        // Extract token value of sessiondata access token
        const jwtTokenVerificationResult: successResponseJson = await extractJwtTokenValue(req.session?.sessiondata?.accessToken as string);
        if (jwtTokenVerificationResult.status !== "SUCCESS") {
            throw new ServiceUnavailableError("Failed to extract JWT token value from sessiondata access token");
        }
        const accessToken: string = (jwtTokenVerificationResult.data as { jwtTokenValue?: string })?.jwtTokenValue as string
        const jwtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

        // Create Auth Token
        const jwtAuthToken = await generateJwtToken({ accessToken: accessToken, userType: req.session.userType }, "12m", jwtSecretKey);
        // Set Auth Token Cookie
        const setResponseAuthCookieResult: successResponseJson = await setResponseCookie(res, "authToken", jwtAuthToken, 1000 * 60 * 20);
        if (setResponseAuthCookieResult.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceUnavailableError("Failed to set response auth-token cookie");
        }

        // Create Auth Token
        const jwtRefreshToken = await generateJwtToken({ accessToken: accessToken, clientId: req?.session?.sessiondata?.clientId as string, businessId: req?.session?.sessiondata?.businessId as string }, "30m", jwtSecretKey);
        // Set Refresh Token Cookie
        const setResponseRefreshCookieResult: successResponseJson = await setResponseCookie(res, "refreshToken", jwtRefreshToken, 1000 * 60 * 60);
        if (setResponseRefreshCookieResult.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceUnavailableError("Failed to set response refresh-token cookie");
        }


        if (userDetails.is_email_verified === "Y") {
            return { status: "SUCCESS", message: "User login successful", data: updatedUserDetails }
        }
        else if (userDetails.is_email_verified === "N" && userMetaDetailsDoc?.verification_code && userMetaDetailsDoc?.verification_code_expires_at) {
            return { status: "SUCCESS", message: "User login successful, verification code sent to email", data: updatedUserDetails }
        }
        else {
            return { status: "SUCCESS", message: "User login successfull, but failed to send verification code", data: updatedUserDetails }
        }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserLoginService",
            // url: url,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `UserLoginService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// -------------------------------------  XXXXXXXXXXXXXXXXXXXX -------------------------------------  \\

// ------------------------------------- USER ONBOARDING SERVICE -------------------------------------  \\
export const userOnboardingService = async (requestSession: Request["session"], res: Response, aesDecryptedBodyData: Record<string, string> | undefined) => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userOnboardingDetailsValidationSchema>> = userOnboardingDetailsValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Validated data
        const validatedData = validationResult.data;

        // Get user from DB
        // const email = req.session?.userEmail as string;
        // const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ email: email });
        const userId: unknown = requestSession?.userId

        // =========================================
        // ADDRESS DETAILS
        // =========================================
        const addressDocument = {
            user_id: userId as Types.ObjectId,
            billing_address: {
                line1: validatedData.address_details.billing_address.line1,
                line2: validatedData.address_details.billing_address.line2 ?? null,
                city: validatedData.address_details.billing_address.city,
                state: validatedData.address_details.billing_address.state,
                postal_code: validatedData.address_details.billing_address.postal_code,
                country: validatedData.address_details.billing_address.country,
                type: "Billing"
            },

            delivery_address: {
                line1: validatedData.address_details.delivery_address.line1,
                line2: validatedData.address_details.delivery_address.line2 ?? null,
                city: validatedData.address_details.delivery_address.city,
                state: validatedData.address_details.delivery_address.state,
                postal_code: validatedData.address_details.delivery_address.postal_code,
                country: validatedData.address_details.delivery_address.country,
                type: "Delivery"
            }
        };

        // =========================================
        // BANK DETAILS
        // =========================================
        const bankDocument = {
            user_id: userId as Types.ObjectId,
            bank_name: validatedData.bank_details.bank_name,
            account_holder_name: validatedData.bank_details.account_holder_name,
            account_number: validatedData.bank_details.account_number,
            swift_code: validatedData.bank_details.swift_code,
            iban_code: validatedData.bank_details.iban_code,
            user_bank_request_id: crypto.randomUUID()
        };

        // Check Existing User address details
        const existingUserAddressDetailsDoc = await user_address_details.findOne({
            user_id: userId as Schema.Types.ObjectId,
        });
        // Check Existing User bank details
        const existingUserBankDetailsDoc = await user_bank_details.findOne({
            user_id: userId as Schema.Types.ObjectId,
        });

        if (!existingUserAddressDetailsDoc && !existingUserBankDetailsDoc) {
            // INSERT DOCUMENTS
            const insertedAddressDocument =
                await user_address_details.create(
                    addressDocument
                );
            const insertedBankDocument =
                await user_bank_details.create(
                    bankDocument
                );

            return {
                status: "SUCCESS",
                message:
                    "User address and bank details added successfully",
                data: {
                    address_details:
                        insertedAddressDocument,

                    bank_details:
                        insertedBankDocument,
                },
            };
        }
        else if (!existingUserAddressDetailsDoc && existingUserBankDetailsDoc) {
            // Insert user address details
            const insertedAddressDocument =
                await user_address_details.create(
                    addressDocument
                );

            // Update user bank details
            const { user_id, ...updatableBankFields } = bankDocument;
            const updatedBankDocument = await user_bank_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId
                },
                {
                    ...updatableBankFields,
                    is_verified: false
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            return {
                status: "SUCCESS",
                message:
                    "Address added and bank details updated successfully",
                data: {
                    address_details:
                        insertedAddressDocument,

                    bank_details:
                        updatedBankDocument,
                },
            };
        }
        else if (!existingUserBankDetailsDoc && existingUserAddressDetailsDoc) {
            // Insert user bank details
            const insertedBankDocument =
                await user_bank_details.create(
                    bankDocument
                );
            // Update the user addresss details
            const { user_id, ...updatableAddressFields } = addressDocument;
            const updatedAddressDocument = await user_address_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId
                },
                {
                    ...updatableAddressFields,
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            return {
                status: "SUCCESS",
                message:
                    "Bank details added and address updated successfully",
                data: {
                    address_details:
                        updatedAddressDocument,

                    bank_details:
                        insertedBankDocument,
                },
            };
        }
        else if (existingUserAddressDetailsDoc && existingUserBankDetailsDoc && !existingUserBankDetailsDoc?.is_verified) {
            // Update the user address details & bank detais
            const { user_id: addressUserId, ...updatableAddressFields } = addressDocument;
            const updatedAddressDocument = await user_address_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId
                },
                {
                    ...updatableAddressFields,
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            // Update user bank details
            const { user_id: bankUserId, ...updatableBankFields } = bankDocument;
            const updatedBankDocument = await user_bank_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId
                },
                {
                    ...updatableBankFields,
                    is_verified: false
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            return {
                status: "SUCCESS",
                message:
                    "Bank details and address details updated successfully",
                data: {
                    address_details:
                        updatedAddressDocument,

                    bank_details:
                        updatedBankDocument,
                },
            };
        }
        else {
            throw new ServiceError("Address and bank details already exist for this user");
        }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserOnboardingService",
            // url: url,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `UserOnboardingService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// -------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------------  \\

// ------------------------------------- SEND BANK VERIFICATION MAIL SERVICE ------------------------------------- \\
export const sendBankVerificationMailService = async (requestSession: Request["session"], res: Response, aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
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
        const userBankDetailsDoc = await user_bank_details.findOne({
            user_id: userId as Schema.Types.ObjectId
        });
        if (!userBankDetailsDoc) {
            throw new NotFoundError("User bank details not found")
        }

        const jwtSecretKey = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"
        // Create Kyv Verification Approve Auth Token
        const approveToken = jwt.sign(
            {
                userId,
                userName,
                dashboardName,
                action: "APPROVE",
                userBankRequestId: userBankDetailsDoc?.user_bank_request_id
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
                userBankRequestId: userBankDetailsDoc?.user_bank_request_id
            },
            jwtSecretKey,
            {
                expiresIn: "2d",
            }
        );

        // Backend webhook URLs
        const approveUrl = `${requestSession?.sessiondata?.baseUrl}/api/v1/public/user/bankVerificationWebhook?token=${encodeURIComponent(approveToken)}`;
        const rejectUrl = `${requestSession?.sessiondata?.baseUrl}/api/v1/public/user/bankVerificationWebhook?token=${encodeURIComponent(rejectToken)}`;

        // Generate email template
        const emailTemplate = generateEmailTemplate(
            "USER_BANK_VERIFICATION",
            {
                userId: userId as string,
                userName: userName,
                accountHolderName: userBankDetailsDoc?.account_holder_name,
                accountNumber: userBankDetailsDoc?.account_number,
                bankName: userBankDetailsDoc?.bank_name,
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

        return { status: "SUCCESS", data: {}, message: "User bank account verificaiton email sent" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SendBankVerificationMailService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `SendBankVerificationMailService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- USER BANK VERIFICATION WEBHOOK SERVICE ------------------------------------- \\
interface userBankVerificationJwtPayloadType extends JwtPayload {
    userId: string;
    userName: string;
    dashboardName: string;
    action: "APPROVE" | "REJECT";
    userBankRequestId: string;
}

export const userBankVerificationWebhookService = async (res: Response, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson | failedResponseJson | void> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid request query params data");
        }

        // Verify JWT kyc verification auth token
        const token = aesDecryptedQueryData.token;
        if (!token || typeof token !== "string") {
            throw new BadRequestError("Invalid or incomplete token in user bank account verification webhook");
        }

        const jwtSecret = process.env.JWT_SECRET_KEY as string;
        const decoded = jwt.verify(token, jwtSecret) as userBankVerificationJwtPayloadType
        const userId: unknown = decoded.userId;

        // Verify token
        const currentUserBankDetailsDoc = await user_bank_details.findOne({ user_id: decoded.userId });
        if (currentUserBankDetailsDoc?.user_bank_request_id !== decoded?.userBankRequestId) {
            // throw new ServiceError("Expired kyc verification link.")
            return { status: "SERVICE_ERROR", message: "Exipred verification link" }
        }

        // Update the user bank request id
        const updatedUserBankDetailsDoc = await user_bank_details.findOneAndUpdate(
            {
                user_id: userId as Types.ObjectId
            },
            {
                user_bank_request_id: crypto.randomUUID()
            },
            {
                new: true,
                runValidators: true
            }
        );
        if (!updatedUserBankDetailsDoc) {
            throw new ServiceError(
                "Failed to update user bank details request_id"
            );
        }

        // Get user details
        const userDetailsDoc = await user_details.findOne({
            _id: userId as Schema.Types.ObjectId
        })
        if (!userDetailsDoc) {
            throw new NotFoundError("User details not found");
        }

        if (decoded.action === "APPROVE") {
            // Update User Bank Account Status in DB
            const userBankDetailsDoc = await user_bank_details.findOneAndUpdate(
                {
                    user_id: decoded.userId,
                },
                {
                    is_verified: true,
                },
                {
                    new: true,
                }
            );
            if (!userBankDetailsDoc) {
                throw new ServiceError("Failed to update the user details for bank account status")
            }

            // =======================
            // Success mail to user
            // =======================
            // Generate email template
            const emailTemplate = generateEmailTemplate(
                "BANK_VERIFICATION_ACCEPTED",
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
                "BANK_VERIFICATION_ACCEPTED_ADMIN",
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

            return { status: "SUCCESS", data: "User bank account verification accepted", message: "User bank account verification email webhook sent succesfully" }
        }
        else if (decoded.action === "REJECT") {
            // Update User Bank Account Status in DB
            const userBankDetailsDoc = await user_bank_details.findOneAndUpdate(
                {
                    user_id: decoded.userId,
                },
                {
                    is_verified: false,
                },
                {
                    new: true,
                }
            );
            if (!userBankDetailsDoc) {
                throw new ServiceError("Failed to update the user details for bank account status")
            }

            // Generate email template
            const emailTemplate = generateEmailTemplate(
                "BANK_VERIFICATION_REJECTED",
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

            return { status: "SUCCESS", data: "User bank account verification rejected", message: "User bank account verification email webhook send succesfully" }
        }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetUserBankVerificationWebhookService",
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
        throw new ServiceUnavailableError("GetUserBankVerificationWebhookService is unavailbale as facing unknown issue.", error)
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\