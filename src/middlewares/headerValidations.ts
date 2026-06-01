import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import extractJwtTokenValue from "../utils/extractJwtTokenValue.js";
import cookieParser from "cookie-parser";
import { AppErrorClass, ForbiddenError, InternalSeverError, InvalidHeaderError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import type { userDetailsSchemaTypes } from "../types/schemaTypes.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import destroySession from "../utils/destroySession.js";
import logger from "../utils/logger.js";

const headerValidations = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        // Skip portal header check for selcted pathes
        const excludedPaths: string[] = ["/signUp", "/login", "/sendResetPasswordCode", "/verifyResetPasswordCode"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }

        // Validate X-API-KEY header
        const xApiKey: string = req.headers["x-api-key"] as string;

        if (xApiKey !== req.session?.sessiondata?.requestXApiKey) {
            throw new UnauthorizedError("INVALID 'x-api-key'")
        }

        // ----------------------------------- Logic to validate authorization header ----------------------------------- \\
        // Validate Authorization header
        const authorizationHeader = req.headers["authorization"] as string;
        if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
            throw new InvalidHeaderError("'authorization' header missing or not in Bearer token format")
        }
        if (!authorizationHeader.split(" ")[1]) {
            throw new InvalidHeaderError("'authorization' header missing token")
        }
        // Extract access token
        const authorizationHeaderToken: string = authorizationHeader.split(" ")[1] as string;
        if (authorizationHeaderToken && (authorizationHeaderToken !== req.session?.sessiondata?.accessToken)) {
            throw new UnauthorizedError("Invalid authorization token")
        }
        // Extract token value of authorization header access token
        const jwtTokenVerificationResult1: successResponseJson = extractJwtTokenValue(authorizationHeaderToken as string);
        if (jwtTokenVerificationResult1.status !== "SUCCESS") {
            throw new ServiceUnavailableError("ExtractJwtTokenValue service unavailbale")
        }
        const jwtAccessTokenValue1: string | undefined = (jwtTokenVerificationResult1.data as { jwtTokenValue?: string })?.jwtTokenValue;

        // Extract token value of sessiondata access token
        const jwtTokenVerificationResult2: successResponseJson = extractJwtTokenValue(req.session?.sessiondata?.accessToken as string);
        if (jwtTokenVerificationResult2.status !== "SUCCESS") {
            throw new ServiceUnavailableError("ExtractJwtTokenValue service unavailbale")
        }
        const jwtAccessTokenValue2: string | undefined = (jwtTokenVerificationResult2.data as { jwtTokenValue?: string })?.jwtTokenValue;
        if (!jwtAccessTokenValue1 || !jwtAccessTokenValue2 || jwtAccessTokenValue1 !== jwtAccessTokenValue2) {
            throw new UnauthenticatedError("Invalid or expired access token")
        }
        // -------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX -------------------------------------- \\

        // Validate Agent Code header
        const agentCode: string = req.headers["agent-code"] as string;
        if (agentCode !== req.session?.sessiondata?.agentCode) {
            throw new UnauthorizedError("INVALID 'agent-code'")
        }

        // Validate Subagent Code header
        const subAgentCode: string = req.headers["subagent-code"] as string;
        if (subAgentCode !== req.session?.sessiondata?.subAgentCode) {
            throw new UnauthorizedError("INVALID 'subagent-code'")
        }

        // Validate Program Id header
        const programId: string = req.headers["program-id"] as string;
        if (programId !== req.session?.sessiondata?.programId) {
            throw new UnauthorizedError("INVALID 'program-id'")
        }

        // Validate Business Id header
        const businessId: string = req.headers["business-id"] as string;
        if (businessId !== req.session?.sessiondata?.businessId) {
            throw new UnauthorizedError("INVALID 'business-id'")
        }

        // Validate Client Id header
        const clientId: string = req.headers["client-id"] as string;
        if (clientId !== req.session?.sessiondata?.clientId) {
            throw new UnauthorizedError("INVALID 'client-id'")
        }

        // Skip user existance check for selcted pathes
        const excludedPaths3: string[] = ["/login"];
        if (excludedPaths3.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }
        // Check user details
        let userDetails: userDetailsSchemaTypes | null
        // Get user from DB
        const checkUserExistInDB = async (req: Request): Promise<userDetailsSchemaTypes | null> => {
            const userExistResponse: userDetailsSchemaTypes | null = await user_details.findById(req.session.userId);
            return userExistResponse;
        }
        userDetails = await checkUserExistInDB(req);

        // Check user exist in DB
        if (!userDetails) {
            try {
                const destroySessionResponse = await destroySession(req.session, res);

                if (destroySessionResponse?.status !== "SUCCESS") {
                    if ((destroySessionResponse as failedResponseJson)?.error) {
                        throw new InternalSeverError("FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error)
                    }
                    else {
                        throw new InternalSeverError("FAILED TO DESTROY SESSION")
                    }
                }
                throw new ForbiddenError("User does not exists");
            }
            catch (error) {
                throw new InternalSeverError("DESTROY SESSION SERVICE FACING ISSUE.");
            }
        }

        // Check agent-code and subagent-code
        if (!userDetails?.agent_code || userDetails?.agent_code !== agentCode || !userDetails?.subagent_code || userDetails?.subagent_code !== subAgentCode) {
            throw new UnauthorizedError("Unauthorized access");
        }

        next();
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "HeaderValidation",
            // url: req.path,
            // method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `HeaderValidation facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

export default headerValidations;