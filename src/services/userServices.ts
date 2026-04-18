import type { Request, Response } from "express"
import { AppErrorClass } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import userLoginValidationSchema from "../validations/userLoginValidation.js";
import type { userDetailsSchemaTypes } from "../types/schemaTypes.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import destroySession from "../utils/destroySession.js";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import normalizeIp from "../utils/normalizeIp.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import type { sessionDataTypes } from "../types/sessionTypes.js";
import type { successResponseJson } from "../types/responseJson.js";
import extractJwtTokenValue from "../utils/extractJwtTokenValue.js";
import generateJwtToken from "../utils/generateJwtToken.js";
import setResponseCookie from "../utils/setResponseCookie.js";
import checkStringBody from "../utils/checkStringBody.js";
import { getDnsConfigService } from "./configServices.js";
import type { ParsedQs } from "qs";
import userDetailsValidationSchema from "../validations/userDetailsValidation.js";

export const userSignUpService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined) => {
    try {
        if (!aesDecryptedBodyData) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Invalid body data");
        }

        if (!req.session || !req.session?.initiated || !req.session?.lastActivity || !req.session?.sessiondata || !req.session?.meta) {
            throw new AppErrorClass(400, "UNAUTHENTICATED", "Unauthenticated acccess")
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new AppErrorClass(400, "NOT_FOUND", "Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Email not present in the request body");
        }

        // Check password present in request body
        const userPassword: string | null = checkStringBody(aesDecryptedBodyData, "password")
        if (!userPassword) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Email not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userDetailsValidationSchema>> = userDetailsValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            // return res.status(400).json({
            //     status: "ERROR",
            //     message: "Invalid request body",
            //     // errors: validationResult.error.issues.map(issue => issue.message)
            //     // errors: validationResult.error.issues.map(issue => ({
            //     //     [issue.path.join(".")]: issue.message
            //     // }))
            //     errors: z.flattenError(validationResult.error)
            // });
            throw new AppErrorClass(400, "ERROR", "Invalid request", z.flattenError(validationResult.error));
        }

        // Get user from DB
        const checkUserExistInDB = async (req: Request): Promise<boolean | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findOne({ email: email });
            return userExistResponse !== null;
        }
        const userExistance: boolean | null = await checkUserExistInDB(req);

        // Check user exist in DB
        if (userExistance) {
            const destroySessionResponse = await destroySession(req, res);
            throw new AppErrorClass(400, "FORBIDDEN", "User already exists");
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
            client_id: aesDecryptedBodyData?.client_id || req.session?.sessiondata?.clientId
        };

        // Insert document in collection
        const insertedDocument = await user_details.create(document);

        // console.log("Document inserted: ", insertedDocument);
        return { status: "SUCCESS", message: "Document inserted successfully", data: insertedDocument }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignUP is facing issue.")
    }
}

export const userLoginService = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string> | undefined, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined) => {
    try {
        if (!aesDecryptedBodyData) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Invalid request body data");
        }
        if (!aesDecryptedQueryData) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Invalid query data");
        }
        if (!req.session || !req.session?.initiated || !req.session?.lastActivity || !req.session?.sessiondata || !req.session?.meta) {
            const getDnsConfigServiceResponse: Record<string, any> | undefined = await getDnsConfigService(req, res, aesDecryptedQueryData);

            if (getDnsConfigServiceResponse?.status !== "SUCCESS") {
                throw new AppErrorClass(400, "ERROR", "getDnsConfigService facing isssue");
            }
        }

        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("user_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new AppErrorClass(400, "NOT_FOUND", "Required collection does not exist in MongoDB");
        }

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Email not present in the request body");
        }

        // Check password present in request body
        const password: string | null = checkStringBody(aesDecryptedBodyData, "password")
        if (!password) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Email not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userLoginValidationSchema>> = userLoginValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            // return res.status(400).json({
            //     status: "ERROR",
            //     message: "Invalid request body",
            //     // errors: validationResult.error.issues.map(issue => issue.message)
            //     // errors: validationResult.error.issues.map(issue => ({
            //     //     [issue.path.join(".")]: issue.message
            //     // }))
            //     errors: z.flattenError(validationResult.error)
            // });
            throw new AppErrorClass(400, "ERROR", "Invalid request", z.flattenError(validationResult.error));
        }

        // Get user from DB
        const checkUserExistInDB = async (req: Request): Promise<userDetailsSchemaTypes | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findOne({ email: email });
            return userExistResponse;
        }
        const userDetails: userDetailsSchemaTypes | null = await checkUserExistInDB(req);

        // Check user exist in DB
        if (!userDetails) {
            const destroySessionResponse = await destroySession(req, res);
            throw new AppErrorClass(400, "FORBIDDEN", "User does not exist")
        }

        // Check user input password validity
        const isPasswordValid = compareSync(aesDecryptedBodyData?.password as string, userDetails?.password);
        if (!isPasswordValid) {
            const destroySessionResponse = await destroySession(req, res);
            throw new AppErrorClass(400, "FORBIDDEN", "Invalid credentials")
        }

        // Check user configuration
        if (userDetails.agent_code !== req.session?.sessiondata?.agentCode || userDetails.subagent_code !== req.session?.sessiondata?.subAgentCode || userDetails.program_id !== req.session?.sessiondata?.programId || userDetails.business_id !== req.session?.sessiondata?.businessId || userDetails.client_id !== req.session?.sessiondata?.clientId) {
            const destroySessionResponse = await destroySession(req, res);
            throw new AppErrorClass(400, "FORBIDDEN", "User configuration does not match")
        }

        // Update user status in DB if not already activated
        let updatedUserDetails: userDetailsSchemaTypes
        if (userDetails?.is_active === false) {
            updatedUserDetails = await user_details.findByIdAndUpdate(userDetails._id, { is_active: true, status: "ACTIVE" }, { new: true }) as userDetailsSchemaTypes;
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

        // Insert user meta details
        const userMetaDetailsDoc = await user_meta_details.findOneAndUpdate(
            { user_id: updatedUserDetails._id },
            { device_id: deviceId, ip_address: clientIp, userAgent: req.headers["user-agent"], login_at: new Date() },
            { upsert: true, new: true }
        )

        // Check if meta user data updated
        if (!userMetaDetailsDoc) {
            throw new AppErrorClass(400, "ERROR", "Failed to update user meta details");
        }

        // Check if session is already valid, if yes then delete the old session and create a new session
        if (req.session.valid && req.session.userId === updatedUserDetails._id.toString()) {
            // Get sessiondata from session before destroying the session
            const sessionData: sessionDataTypes = req.session.sessiondata;

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

            // Set sessiondata in new session
            req.session.sessiondata = sessionData;
        }

        // Update session with userId and email
        req.session.userEmail = updatedUserDetails.email;
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
            throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Failed to extract JWT token value from sessiondata access token");
        }
        const accessToken: string = (jwtTokenVerificationResult.data as { jwtTokenValue?: string })?.jwtTokenValue as string
        const jwtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

        // Create Auth Token
        const jwtAuthToken = await generateJwtToken({ accessToken: accessToken, userType: req.session.userType }, "12m", jwtSecretKey);
        // Set Auth Token Cookie
        const setResponseAuthCookieResult: successResponseJson = await setResponseCookie(res, "authToken", jwtAuthToken, 1000 * 60 * 20);
        if (setResponseAuthCookieResult.status.toUpperCase() !== "SUCCESS") {
            throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Failed to set response auth-token cookie");
        }

        // Create Auth Token
        const jwtRefreshToken = await generateJwtToken({ accessToken: accessToken, clientId: req?.session?.sessiondata?.clientId as string, businessId: req?.session?.sessiondata?.businessId as string }, "30m", jwtSecretKey);
        // Set Refresh Token Cookie
        const setResponseRefreshCookieResult: successResponseJson = await setResponseCookie(res, "refreshToken", jwtRefreshToken, 1000 * 60 * 60);
        if (setResponseRefreshCookieResult.status.toUpperCase() !== "SUCCESS") {
            throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Failed to set response refresh-token cookie");
        }

        return { status: "SUCCESS", message: "User login successfull", data: updatedUserDetails }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignIn is facing issue.")
    }
}