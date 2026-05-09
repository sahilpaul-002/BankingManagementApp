import type { Request, Response } from 'express';
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { symmetricDecryptionMsg, symmetricEncryptionMsg } from '../utils/symmetricEncryptionDecryption.js';
import { asymmetricDecryptionMsg } from '../utils/asymmetricEncryptionDecryption.js';
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from '../utils/AppErrorClass.js';
import type { decryptionFailedJson, decryptionSuccessJson } from '../types/decryptionRespoonseTypes.js';
import { getAesEncryptionKeyService, getDnsConfigService, getHeaderPublicKeyService, getMobileCountryCodesService, getRsaPublicKeyService } from '../services/configServices.js';
import logger from '../utils/logger.js';

// FUNCTION TO GET THE DNS CONFIGURATION DATA
export const getDnsConfig = async (req: Request, res: Response<successResponseJson | failedResponseJson>): Promise<Response<successResponseJson> | void> => {
    let aesDecryptedQueryData: any = null;
    let ivHex: string | undefined
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };

            // RSA Asummetric payload decryption
            try {
                // Get encrypted payload1
                const encryptedPayload1: string = req?.query?.encryptedPayload1 as string

                // Decrypt encryptedPayload1
                const decryptionMsgResponse1 = asymmetricDecryptionMsg(req, encryptedPayload1);
                if (decryptionMsgResponse1 && decryptionMsgResponse1.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse1 as decryptionSuccessJson;
                    rsaDecryptedData = JSON.parse(successResponse?.decryptedText);
                    ivHex = rsaDecryptedData.ivHex
                    // console.log(rsaDecryptedData)
                }
                else if (decryptionMsgResponse1 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse1.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse1 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Asymmetric decryption error - cipher text not found.");
                    }
                }
                else {
                    throw new ServiceError("Asymmetric decryption service unavailable");
                }
            }
            catch (err) {
                throw new ServiceUnavailableError("Asymmetric decryption service is not working.", err);
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted payload2
                const encryptedPayload2: string = req?.query?.encryptedPayload2 as string

                // Decrypt encryptedPayload1
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedPayload2, ivHex);
                if (decryptionMsgResponse2 && decryptionMsgResponse2.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse2 as decryptionSuccessJson;
                    aesDecryptedQueryData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedQueryData)
                }
                else if (decryptionMsgResponse2 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse2.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse2 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new ServiceError("Symmetric decryption service unavailable");
                }
            }
            catch (err) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.", err);
            }
        }
        else {
            aesDecryptedQueryData = req.query;
        }
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetDnsConfigRequestPayloadDecryption",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetDnsConfigRequestPayloadDecryption service is facing unknown issue.", err);
    }
    try {
        const getDnsConfigServiceResponse: successResponseJson = await getDnsConfigService(req, res, aesDecryptedQueryData);

        if (getDnsConfigServiceResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "getDnsConfigService facing isssue", 400);
        }

        const responseObj = getDnsConfigServiceResponse?.data;

        const fromPortal: string = req?.headers["from-portal"] as string;
        if (fromPortal === "true") {
            // Encrypt response using AES
            const symmetricEncryptionMsgResponse = symmetricEncryptionMsg(req, responseObj, ivHex as string);
            if (symmetricEncryptionMsgResponse?.status !== "SUCCESS") {
                throw new ServiceUnavailableError("Symmetric encryption service unavailbale")
            }

            return res.success("DNS config fetch successfully", symmetricEncryptionMsgResponse?.ciphertextHex, 200);
        }
        return res.success("DNS config fetch successfully", responseObj, 200)

    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetDnsConfigController",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetDnsConfigController service is facing unknown issue.", error);
    }
}

// FUNCTION TO GET THE SYMMETRIC ENCRYPTION KEY
export const getEncryptionKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get the encryption key
        const encryptionKeyServiceResponse = getAesEncryptionKeyService(req);
        if (encryptionKeyServiceResponse?.status.toUpperCase() !== "SUCCESS" || !encryptionKeyServiceResponse?.data) {
            return res.fail("SERVICE_ERROR", "Failed to generate symmetric encryption key", 400);
        }
        return res.success("Encryption key fetch successfully", { key: encryptionKeyServiceResponse?.data }, 200);
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetEncryptionKeyController",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetEncryptionKeyController service is facing unknown issue.", error)
    }
}

// FUNCTION TO GET THE ASYMMETRIC ENCRPTION PUBLIC KEY
export const getPublicKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get public encryption key
        const publicKeyServiceResponse = getRsaPublicKeyService(req);
        if (publicKeyServiceResponse?.status.toUpperCase() !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to generate asymeetric public key", 400);
        }

        return res.success("Public key fetch successfully", { key: publicKeyServiceResponse?.data }, 200);
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetPublicKeyController",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetPublicKeyController service is facing unknown issue.", error)
    }
}

// FUNCTION TO GET THE MOBILE COUNTRY CODES
export const getMobileCountryCodes = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        const mobileCountryCodesServiceResponse = getMobileCountryCodesService(req);
        if (mobileCountryCodesServiceResponse?.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("Failed to fetch mobile country codes")
        }

        return res.success("Mobile country codes fetch successfully", mobileCountryCodesServiceResponse.data, 200);
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetMobileCountryCodesController",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetMobileCountryCodesController service is facing unknown issue.", error)
    }
}

// FUNCTION TO GET THE HEADER ASYMMETRIC ENCRPTION PUBLIC KEY
export const getHeaderPublicKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get public encryption key
        const publicKeyServiceResponse = getHeaderPublicKeyService(req);
        if (publicKeyServiceResponse?.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("Failed to generate asymeetric public key")
        }
        return res.success("Public key fetch successfully", { key: publicKeyServiceResponse.data }, 200);
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetHeaderPublicKeyController",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetHeaderPublicKeyCController service is facing unknown issue.", error)
    }
}