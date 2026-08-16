import type { Request, Response } from "express"
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestQueryError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userLoginValidationSchema from "../validations/userLoginValidation.js";
import type { billingAddressTypes, deliveryAddressTypes, userDetailsDocumentType, userDetailsSchemaTypes } from "../types/schemaTypes.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import destroySession from "../utils/destroySession.js";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import normalizeIp from "../utils/normalizeIp.js";
import type { sessionDataTypes } from "../types/sessionTypes.js";
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
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import { userOnboardingDetailsValidationSchema } from "../validations/userOnboardingDetailsValidation.js";
import mongoose, { Types } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv"
import { gmailSendService } from "./gmailSendService.js";
import userOnboardingTransaction from "../mongoDbTransactions/userOnboardingTransaction.js";
import userLoginTransaction from "../mongoDbTransactions/userLoginTransaction.js";
import userBankVerifyTransaction from "../mongoDbTransactions/verifyUserBankDetailsTransaction.js";
import userSignUpTransaction from "../mongoDbTransactions/userSignUpTransaction.js";
import crypto from "crypto";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import { userFundingBankAccountDetailsModel as user_funding_bank_account_details } from "../models/user_funding_bank_account_details.js";

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"
const bmaNotificationMail = process.env.BMA_EMAIL || "bma_notification@yopmail.com"

// ------------------------------------- USER SIGN UP SERVICE -------------------------------------  \\
export const userSignUpService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson> => {
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
                throw new ServiceError("getDnsConfigService facing issue");
            }
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");

        }

        // Check password present in the request body
        const userPassword: string | null = checkStringBody(aesDecryptedBodyData, "password");
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

        // Check User Exist
        const emailExists = await user_details.exists({
            email: validationResult.data.email
        });
        if (emailExists) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User already exists");
        }

        // Check Business Nmae / Type
        const businessNameExist = await user_details.exists({
            business_name: validationResult.data.business_name
        })
        if (validationResult?.data?.business_type === "EXISTING" && !businessNameExist) {
            throw new ForbiddenError(`Business name does not exist for the specified type`)
        }
        if (validationResult?.data?.business_type === "NEW") {
            const businessNameExist = await user_details.exists({
                business_name: validationResult.data.business_name
            })
            if (businessNameExist) {
                throw new ForbiddenError(`Business name already exist, use 'EXISTING' type`)
            }
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
        const hashedPassword = hashSync(userPassword as string, salt);

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

        // console.log("Document inserted: ", insertedDocument);
        return { status: "SUCCESS", message: "Document inserted successfully", data: {} }
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
export const userLoginService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson | failedResponseJson> => {
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
                throw new ServiceError("getDnsConfigService facing issue");
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

        // Check User Exist
        let userDetails: userDetailsSchemaTypes | null = await user_details.findOne({ email: email }).lean();

        // Check user exist in DB
        if (!userDetails) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ServiceError("User does not exist")
        }

        // Check user input password validity
        const isPasswordValid = compareSync(password, userDetails?.password);
        if (!isPasswordValid) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ServiceError("Invalid credentials")
        }

        const isCollectionPresent2 = await checkMongoDbCollectionExist("user_meta_details");
        if (isCollectionPresent2.status !== "SUCCESS") {
            throw new NotFoundError("User_meta_details collection does not exist in MongoDB");
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
        const deviceId = req.headers['x-device-id'] as string;

        // User login transaction
        const userLoginTransactionResult = await userLoginTransaction(userDetails, deviceId, clientIp, req.headers["user-agent"] ?? null)

        if (userLoginTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("User login service facing issue. Login failed")
        }

        let userMetaDetailsDoc;
        userDetails = userLoginTransactionResult?.data?.userDetailsDoc;
        userMetaDetailsDoc = userLoginTransactionResult?.data?.userMetaDetailsDoc;

        let sendEmailResponse;
        // Check user email verified
        if (userDetails.is_email_verified === "N") {
            sendEmailResponse = await sendVerificationEmailService(req, res, userDetails.email);
        }

        // Check if session is already valid, if yes then delete the old session and create a new session
        if (req.session.valid && req.session.userId === userDetails._id.toString()) {
            // Get sessiondata from session before destroying the session
            const sessionData: sessionDataTypes = req.session?.sessiondata as sessionDataTypes;
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
        req.session.userEmail = userDetails.email;
        req.session.userConfiguration = {
            businessName: userDetails.business_name,
            programType: userDetails.program_type,
            programId: userDetails.program_id,
            businessId: userDetails.business_id,
            agentCode: userDetails.agent_code,
            subAgentCode: userDetails.subagent_code
        }
        req.session.userName = userDetails.full_name;
        req.session.userId = userDetails._id.toString();
        req.session.userType = userDetails.is_master_admin === "Y" ? "MASTER_ADMIN" : userDetails.is_admin === "Y" ? "ADMIN" : "USER";
        req.session.cardholderId = userDetails.cardholder_id?.toString() ?? null

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
        const jwtRefreshToken = await generateJwtToken({ accessToken: accessToken, clientId: req?.session?.userConfiguration?.programId as string, businessId: req?.session?.userConfiguration?.businessId as string }, "30m", jwtSecretKey);
        // Set Refresh Token Cookie
        const setResponseRefreshCookieResult: successResponseJson = await setResponseCookie(res, "refreshToken", jwtRefreshToken, 1000 * 60 * 60);
        if (setResponseRefreshCookieResult.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceUnavailableError("Failed to set response refresh-token cookie");
        }

        const frontendUserDetails = {
            userId: userDetails?._id,
            fullName: userDetails?.full_name,
            userEmail: userDetails?.email,
            businessId: userDetails?.business_id,
            programId: userDetails?.program_id,
            agentCode: userDetails?.agent_code,
            subagentCode: userDetails?.subagent_code,
            mobileCountryCode: userDetails?.mobile_country_code,
            mobileCountryName: userDetails?.mobile_country_name,
            gender: userDetails?.gender,
            dob: userDetails?.date_of_birth,
            isAdmin: userDetails?.is_admin,
            isMasterAdmin: userDetails?.is_master_admin,
            isEmailVerified: userDetails?.is_email_verified,
            is2FaEnabled: userDetails?.is_2fa_enabled,
            twoFaType: userDetails?.two_fa_type,
            cardholderId: userDetails?.cardholder_id?.toString(),
            authenticatorSecret: userDetails?.authenticator_secret
        }

        // Check if user email verified
        if (userDetails?.is_email_verified === "N" && sendEmailResponse?.status === "SUCCESS" && userMetaDetailsDoc?.verification_code && userMetaDetailsDoc?.verification_code_expires_at) {
            return { status: "SUCCESS", message: "User login successful, verification code sent to email", data: frontendUserDetails }
        }
        else if (userDetails?.is_email_verified === "N" && (sendEmailResponse?.status !== "SUCCESS" || !userMetaDetailsDoc?.verification_code || !userMetaDetailsDoc?.verification_code_expires_at)) {
            return { status: "SUCCESS", message: "User login successfull, but failed to send verification code", data: frontendUserDetails }
        }
        else if (userDetails?.is_email_verified === "Y" && (userDetails.is_2fa_enabled !== "Y" || !userDetails?.two_fa_type)) {
            return { status: "SUCCESS", message: "User login successfull, 2fa not enabled", data: frontendUserDetails }
        }
        else if (userDetails?.is_email_verified === "Y" && userDetails?.is_2fa_enabled === "Y" && userDetails?.two_fa_type) {
            return { status: "SUCCESS", message: "User login successful, 2fa enabled", data: frontendUserDetails }
        }
        else {
            return { status: "SERVICE_ERROR", message: "User login failed" }
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
export const userOnboardingService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, any> | undefined) => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        const email = checkStringQueryParams(aesDecryptedQueryData, "email")
        if (!email) {
            throw new InvalidRequestQueryError("Email not present in query params")
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist in MongoDB");
        }

        // Check address details present
        if (!aesDecryptedBodyData?.address_details) {
            throw new InvalidRequestBodyError("Adress details not present in the request body")
        }

        // Check bank details present
        if (!aesDecryptedBodyData?.bank_details) {
            throw new InvalidRequestBodyError("Bank details not present in the request body")
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userOnboardingDetailsValidationSchema>> = userOnboardingDetailsValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Validated data
        const validatedData = validationResult.data;

        // Validate email
        if (validatedData.address_details.email !== requestSession?.userEmail || validatedData.bank_details.email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }

        const userId = requestSession?.userId
        if (!userId) {
            throw new UnauthenticatedError("Unauthenticated session detected");
        }

        // =========================================
        // ADDRESS DETAILS
        // =========================================
        const billingAddress: billingAddressTypes = {
            line1: validatedData.address_details.billing_address.line1,
            line2: validatedData.address_details.billing_address.line2 ?? null,
            city: validatedData.address_details.billing_address.city,
            state: validatedData.address_details.billing_address.state,
            postal_code: validatedData.address_details.billing_address.postal_code,
            country: validatedData.address_details.billing_address.country,
            type: "Billing"
        }
        const deliveryAddress: deliveryAddressTypes = {
            line1: validatedData.address_details.delivery_address.line1,
            line2: validatedData.address_details.delivery_address.line2 ?? null,
            city: validatedData.address_details.delivery_address.city,
            state: validatedData.address_details.delivery_address.state,
            postal_code: validatedData.address_details.delivery_address.postal_code,
            country: validatedData.address_details.delivery_address.country,
            type: "Delivery"
        }
        const addressDocument = {
            user_id: new Types.ObjectId(userId),
            billing_address: billingAddress,

            delivery_address: deliveryAddress
        };

        // =========================================
        // BANK DETAILS
        // =========================================
        const bankDocument = {
            user_id: new Types.ObjectId(userId),
            bank_name: validatedData.bank_details.bank_name,
            account_holder_name: validatedData.bank_details.account_holder_name,
            account_number: validatedData.bank_details.account_number,
            swift_code: validatedData.bank_details.swift_code,
            iban_code: validatedData.bank_details.iban_code,
            user_bank_request_id: crypto.randomUUID()
        };

        // Perform user onboarding mongodb transactioon
        const userOnboardingTransactionResult = await userOnboardingTransaction(new Types.ObjectId(userId), addressDocument, bankDocument)

        if (userOnboardingTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("User onboarding service facing issue - failed to onboard user")
        }

        const sendBankVerificationMailServiceResponse = await sendBankVerificationMailService(requestSession, { email })
        if (sendBankVerificationMailServiceResponse?.status !== "SUCCESS") {
            return { status: "SUCCESS", message: `${userOnboardingTransactionResult?.message} - but failed to sent user bank verification mail.`, data: userOnboardingTransactionResult?.data }
        }
        else {
            return { status: "SUCCESS", message: `${userOnboardingTransactionResult?.message} - bank verification mail sent to admin.`, data: userOnboardingTransactionResult?.data }
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
export const sendBankVerificationMailService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request body data");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Get user data from session
        const userEmail = requestSession?.userEmail
        if (!userEmail || userEmail !== email) {
            throw new UnauthenticatedError("Unauthenticated session detected");
        }
        const userId = new Types.ObjectId(requestSession?.userId)
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
        const userDetails = await user_details.findOne({
            _id: userId as Types.ObjectId
        }).select(" business_id program_id agent_code subagent_code").lean();
        if (!userDetails) {
            throw new NotFoundError("User details not found");
        }
        // Check user admin
        let adminEmail: string
        if (userDetails?.subagent_code !== "01") {
            const adminUser = await user_details.findOne({
                business_id: userDetails?.business_id,
                program_id: userDetails?.program_id,
                agent_code: "01",
                subagent_code: "01"
            }).select("email").lean()
            if (!adminUser) {
                throw new ServiceError("Admin user not found or issue in user configuration - please contact support")
            }
            adminEmail = adminUser?.email
        }
        else {
            adminEmail = requestSession?.sessiondata?.adminEmail || bmaNotificationMail
            if (!adminEmail) {
                throw new UnauthenticatedError("Unauthenticated session detected");
            }
        }

        // Get user kyc details
        const userBankDetailsDoc = await user_bank_details.findOne({
            user_id: userId as Types.ObjectId
        }).select("_id user_bank_request_id account_holder_name account_number bank_name").lean();
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
                adminEmail: adminEmail,
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
                adminEmail: adminEmail,
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
                userId: userId.toString(),
                userName: userName,
                accountHolderName: userBankDetailsDoc?.account_holder_name,
                accountNumber: userBankDetailsDoc?.account_number,
                bankName: userBankDetailsDoc?.bank_name,
                dashboardName: dashboardName,
                approveUrl,
                rejectUrl
            }
        );

        const toEmail: string = adminEmail
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
    adminEmail: string
    action: "APPROVE" | "REJECT";
    userBankRequestId: string;
}

export const userBankVerificationWebhookService = async (aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson | failedResponseJson | void> => {
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

        // Perform user onboarding mongodb transactioon
        const userBankVerificationTransactionResult = await userBankVerifyTransaction(decoded)
        if (userBankVerificationTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("UserBankVerify service is facing issue - failed to verify user bank details")
        }
        const userBankDetailsDoc = userBankVerificationTransactionResult?.data?.userBankDetailsDoc
        const userDetailsDoc = userBankVerificationTransactionResult?.data?.userDetailsDoc

        if (decoded.action === "APPROVE") {
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

            const toEmail: string = userDetailsDoc?.email as string;
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

            const toAdminEmail: string = decoded?.adminEmail || bmaNotificationMail
            const mainConfigAdmin = { toEmail: toAdminEmail, sendEmail, dashboardName: "BMA_Admin", emailTemplate: emailTemplateAdmin }
            // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
            const gmailMailServiceResponse2 = await gmailSendService(mainConfigAdmin)

            if (gmailMailServiceResponse2?.status !== "SUCCESS") {
                throw new ServiceError("GmailSendService is facing error")
            }

            return { status: "SUCCESS", data: "User bank account verification accepted", message: "User bank account verification email webhook sent succesfully" }
        }
        else if (decoded.action === "REJECT") {
            // Generate email template
            const emailTemplate = generateEmailTemplate(
                "BANK_VERIFICATION_REJECTED",
                {
                    userName: decoded?.userName,
                    dashboardName: decoded?.dashboardName,
                }
            );

            const toEmail: string = userDetailsDoc?.email as string;
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


export const userPrefundFiatAccountWebhookService = async (aesDecryptedBodyData: Record<string, any> | undefined): Promise<successResponseJson | failedResponseJson | void> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid request query body data");
        }

        const userId = checkStringBody(aesDecryptedBodyData, "user_Id")
        if (!userId) {
            throw new InvalidRequestBodyError("User id is not present in the request body")
        }
        const fiatAccountDetails = aesDecryptedBodyData
        if (!fiatAccountDetails) {
            throw new InvalidRequestBodyError("Fiat account details not present in the request body")
        }
        const bankName = checkStringBody(aesDecryptedBodyData, "bank_name")
        if (!bankName) {
            throw new InvalidRequestBodyError("Bank name is not present in the fiat account details")
        }
        const accountholderName = checkStringBody(aesDecryptedBodyData, "accountholder_name")
        if (!accountholderName) {
            throw new InvalidRequestBodyError("Accountholder name is not present in the fiat account details")
        }
        const accountNumber = checkStringBody(aesDecryptedBodyData, "account_number")
        if (!accountNumber) {
            throw new InvalidRequestBodyError("Account number is not present in the fiat account details")
        }
        const swiftCode = checkStringBody(aesDecryptedBodyData, "swift_code")
        if (!swiftCode) {
            throw new InvalidRequestBodyError("Swift code is not present in the fiat account details")
        }
        const ibanCode = checkStringBody(aesDecryptedBodyData, "iban_code")
        if (!ibanCode) {
            throw new InvalidRequestBodyError("Iban code is not present in the fiat account details")
        }
        const amount = checkStringBody(aesDecryptedBodyData, "amount");
        if (!amount) {
            throw new InvalidRequestBodyError("Amount is not present in the request body");
        }

        // Validate Amount
        const prefundAmountNumber = Number(amount);
        if (!Number.isFinite(prefundAmountNumber) || prefundAmountNumber <= 0) {
            throw new InvalidRequestBodyError("Prefund amount must be a valid number greater than zero");
        }
        const prefundAmount = mongoose.Types.Decimal128.fromString(amount);

        // Find fiat account and update fiat account
        const updatedFiatAccount = await user_funding_bank_account_details.findOneAndUpdate(
            {
                user_id: new Types.ObjectId(userId),
                bank_name: bankName,
                account_holder_name: accountholderName,
                account_number: accountNumber,
                swift_code: swiftCode,
                iban_code: ibanCode,
                is_active: true
            },
            {
                $inc: {
                    account_balance: amount
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).select("_id user_id cardholder_id account_holder_name account_number account_currency account_balance bank_name swift_code iban_code is_active"
        ).lean();
        if (!updatedFiatAccount) {
            throw new NotFoundError("Active prefunding fiat account not found");
        }


        return {
            status: "SUCCESS",
            data: {
                fiatAccount: updatedFiatAccount,
                prefundedAmount: amount.toString()
            },
            message: "Fiat prefunding account loaded successfully"
        };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserPrefundFiatAccountWebhookService",
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
        throw new ServiceUnavailableError("UserPrefundFiatAccountWebhookService is unavailbale as facing unknown issue.", error)
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\