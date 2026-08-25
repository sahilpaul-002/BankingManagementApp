import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import checkStringHeader from "../utils/checkStringHeader.js";
import { request } from "node:http";
import { AppErrorClass, InvalidHeaderError, ServiceError, UnauthenticatedError } from "../utils/AppErrorClass.js";
import { headerAsymmetricDecryptionMsg } from "../utils/asymmetricHeaderEncryptionDecryption.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";
import logger from "../utils/logger.js";

const headerTypeValidation = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Skip portal header check for selcted pathes
    const excludedPaths: string[] = ["/signUp", "/sendVerifyEmailCode", "/sendResetPasswordCode", "/verifyResetPasswordCode"];
    if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
        return next();
    }

    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = (req?.headers["from-portal"] ?? "false") as string;
        // // Validate FROM_PORTAL header
        // const fromPortal: string | null = checkStringHeader(req.headers, "from-portal");
        // if (!fromPortal) {
        //     throw new InvalidHeaderError("'from-portal' MISSING OR NOT STRING")
        // }
        // Check if the api call is not from portal
        if (fromPortal === "true") {
            if (!req.session.headerKeys?.publicKey || !req.session.headerKeys.privateKey) {
                throw new UnauthenticatedError("Unauthenticated session");
            }

            // -------------------------------------- Decrypt Header Items -------------------------------------- \\
            let encryptedHeaderKeys: string[];
            if (req.path === "/login" || req.path.startsWith("/login/")) {
                encryptedHeaderKeys = [
                    "x-device-id"
                ];
            } else {
                encryptedHeaderKeys = [
                    'x-api-key',
                    'agent-code',
                    'subagent-code',
                    'program-id',
                    'business-id',
                    'client-id',
                    "x-device-id",
                    'authorization'
                ];
            }

            try {

                for (const headerKey of encryptedHeaderKeys) {

                    const encryptedValue = req.headers[headerKey] as string;

                    // Skip if header not present
                    if (!encryptedValue) continue;

                    // Decrypt header
                    const decryptionResponse = headerAsymmetricDecryptionMsg(req, encryptedValue);

                    if (
                        decryptionResponse &&
                        decryptionResponse.status.toUpperCase() === "SUCCESS"
                    ) {

                        const successResponse =
                            decryptionResponse as decryptionSuccessJson;

                        let decryptedValue = successResponse.decryptedText;

                        // Convert JSON string to object
                        const parsedValue = JSON.parse(decryptedValue);

                        // Populate decrypted value back into req.headers
                        req.headers[headerKey] = parsedValue.value;
                    }

                    else if (
                        decryptionResponse &&
                        ["NOT_FOUND", "BAD_REQUEST"].includes(
                            decryptionResponse.status.toUpperCase()
                        )
                    ) {

                        const errorResponse =
                            decryptionResponse as decryptionFailedJson;

                        if (
                            errorResponse?.message?.includes(
                                "Assymetric private key not found in session"
                            )
                        ) {
                            throw new UnauthenticatedError(
                                "Unauthenticated Access: Private key not found in session"
                            );
                        }

                        throw new ServiceError(
                            `Header decryption failed for ${headerKey}`
                        );
                    }

                    else {
                        throw new ServiceError(
                            `Asymmetric header decryption service unavailable for ${headerKey}`
                        );
                    }
                }

            } catch (err) {
                const error = err as any;
                const url = req.path || "UNKNOWN_URL";
                const errorStatus = error?.status || "UnknownErrorStatus";

                logger.error(error, {
                    serviceName: "AsymmetricHeaderDecryption",
                    // url: req.path,
                    // method: req.method
                });
                if (error instanceof AppErrorClass) {
                    throw error
                }
                throw new ServiceError(
                    `AsymmetricHeaderDecryption facing issue: [${errorStatus}] ${error.message}`,
                    error?.error ? error.error : error
                );
            }
            // -------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------------- \\
        }
        // Validate Content-Type header for POST, PUT, PATCH requests
        if (req.baseUrl === '/api/v1/kyc' && (req.path === "/upload" || req.path.startsWith("upload" + "/"))) {
            const contentType: string | undefined = req.headers["content-type"];
            if (!contentType || !contentType.includes("multipart/form-data")) {
                throw new InvalidHeaderError("'content-type' header must be multipart/form-data")
            }
        }
        else if (["POST", "PUT", "PATCH"].includes(req.method)) {
            const contentType: string | undefined = req.headers["content-type"];
            if (!contentType || !contentType.includes("application/json")) {
                throw new InvalidHeaderError("'content-type' header must be application/json")
            }
        }

        // Validate the device-id type header
        const devideId: string | null = checkStringHeader(req.headers, "x-device-id");
        if (!devideId) {
            throw new InvalidHeaderError("'device-id' MISSING OR NOT STRING")
        }

        // Validate X-API-Key header
        const xApiKey: string | null = checkStringHeader(req.headers, "x-api-key");
        if (!xApiKey) {
            throw new InvalidHeaderError("'x-api-key' MISSING OR NOT STRING")
        }

        // Skip user existance check for selcted pathes
        const excludedPaths: string[] = ["/login"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }
        else {
            // Validate Authorization header
            const authorizationHeader: string | null = checkStringHeader(req.headers, "authorization");
            if (!authorizationHeader) {
                throw new InvalidHeaderError("'authorization' MISSING OR NOT STRING")
            }

            // Validate Agent Code header
            const agentCode: string | null = checkStringHeader(req.headers, "agent-code")
            if (!agentCode) {
                throw new InvalidHeaderError("'agent-code' MISSING OR NOT STRING")
            }

            // Validate Subagent Code header
            const subAgentCode: string | null = checkStringHeader(req.headers, "subagent-code")
            if (!subAgentCode) {
                throw new InvalidHeaderError("'subagent-code' MISSING OR NOT STRING")
            }

            // Validate Program ID header
            const programId: string | null = checkStringHeader(req.headers, "program-id")
            if (!programId) {
                throw new InvalidHeaderError("'program-id' MISSING OR NOT STRING")
            }

            // Validate Business ID header
            const businessId: string | null = checkStringHeader(req.headers, "business-id")
            if (!businessId) {
                throw new InvalidHeaderError("'business-id' MISSING OR NOT STRING")
            }

            // Validate Client ID header
            const clientId: string | null = checkStringHeader(req.headers, "client-id")
            if (!clientId) {
                throw new InvalidHeaderError("'client-id' MISSING OR NOT STRING")
            }
        }

        next();
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "HeaderTypeValidation",
            // url: req.path,
            // method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `HeaderTypeValidation facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

export default headerTypeValidation;