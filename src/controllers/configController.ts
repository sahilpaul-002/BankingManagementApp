import type { Request, Response } from 'express';
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { portalConfigurationSchemaTypes } from '../types/schemaTypes.js';
import { portalConfigurationsModel as portal_configurations } from "../models/portal_configurations.js";
import checkMongoDbCollectionExist from '../utils/checkMongoDbCollectionExist.js';
import checkStringHeader from '../utils/checkStringHeader.js';
import checkStringBody from '../utils/checkStringBody.js';
import { getSymmetricEncryptionKey, symmetricDecryptionMsg, symmetricEncryptionMsg } from '../utils/symmetricEncryptionDecryption.js';
import errorHandler from '../utils/errorHandler.js';
import { asymmetricDecryptionMsg, getAsymmetricKeyPair } from '../utils/asymmetricEncryptionDecryption.js';
import listCountryMobileCodes from '../utils/listCountryMobileCodes.js';
import setResponseCookie from '../utils/setResponseCookie.js';
import { dnsConfigCache, type LRUCachedData } from '../utils/lruCache.js';
import checkStringParams from '../utils/checkStringParams.js';
import checkStringQueryParams from '../utils/checkStringQueryParams.js';
import type { portalConfigurationDataType } from '../types/apiResponseDataObjectType.js';
import generateJwtToken from '../utils/generateJwtToken.js';
import normalizeIp from '../utils/normalizeIp.js';
import { AppErrorClass } from '../utils/AppErrorClass.js';
import type { decryptionFailedJson, decryptionSuccessJson } from '../types/decryptionRespoonseTypes.js';
import { getDnsConfigService } from '../services/configServices.js';

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
                        throw new AppErrorClass(401, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Asymmetric decryption error - cipher text not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Asymmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Asymmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new AppErrorClass(400, "ERROR", "IV not generated from asymmetric decryption");
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
                        throw new AppErrorClass(401, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Symmetric decryption service is not working.");
            }
        }
        else {
            aesDecryptedQueryData = req.query;
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignUP-requestPayload decryption is facing issue.")
    }
    try {
        const getDnsConfigServiceResponse: Record<string, any> | undefined = await getDnsConfigService(req, res, aesDecryptedQueryData);

        if (getDnsConfigServiceResponse?.status !== "SUCCESS") {
            res.fail("ERROR", "getDnsConfigService facing isssue", 400);
        }

        // Encrypt response using AES
        const responseObj = getDnsConfigServiceResponse?.data;
        const symmetricEncryptionMsgResponse = symmetricEncryptionMsg(req, responseObj, ivHex as string);
        if (symmetricEncryptionMsgResponse?.status !== "SUCCESS") {
            throw new AppErrorClass(503, "SERVICE_UNAVAILABLE", "Symmetric encryption service unavailbale")
        }

        return res.success("DNS config fetch successfully", symmetricEncryptionMsgResponse?.ciphertextHex, 200);
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignUP is facing issue.")
    }
}

// FUNCTION TO GET THE SYMMETRIC ENCRYPTION KEY
export const getEncryptionKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get the encryption key
        const encryptionKeyResponse = getSymmetricEncryptionKey(req);
        if (encryptionKeyResponse?.status.toUpperCase() === "SUCCESS") {
            return res.success("Encryption key fetch successfully", { key: encryptionKeyResponse.key }, 200);
        }
        else {
            return res.fail("ERROR", "Failed to generate symmetric encryption key", 400);
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("GetEncryptionKey is facing issue.")
    }
}

// FUNCTION TO GET THE ASYMMETRIC ENCRPTION PUBLIC KEY
export const getPublicKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get public encryption key
        const publicKeyResponse = getAsymmetricKeyPair(req);
        if (publicKeyResponse?.status.toUpperCase() === "SUCCESS") {
            return res.success("Public key fetch successfully", { key: publicKeyResponse.publicKey }, 200);
        }
        else {
            return res.fail("ERROR", "Failed to generate asymeetric public key", 400);
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("GetPublicKey is facing issue.")
    }
}

// FUNCTION TO GET THE MOBILE COUNTRY CODES
export const getMobileCountryCodes = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        const mobileCountryCodesResponse = listCountryMobileCodes();
        if (mobileCountryCodesResponse?.status.toUpperCase() === "SUCCESS") {
            return res.success("Mobile country codes fetch successfully", mobileCountryCodesResponse.data, 200);
        }
        else {
            return res.fail("ERROR", "Failed to fetch mobile country codes", 400);
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("GetMobileCountryCodes is facing issue.")
    }
}