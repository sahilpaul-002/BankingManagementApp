import type { Request, Response } from 'express';
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { portalConfigurationSchema } from '../types/schemaTypes.js';
import { portalConfigurationsModel as portal_configurations } from "../models/portal_configurations.js";
import checkMongoDbCollectionExist from '../utils/checkMongoDbCollectionExist.js';
import checkStringHeader from '../utils/checkStringHeader.js';
import checkStringBody from '../utils/checkStringBody.js';
import { getSymmetricEncryptionKey } from '../utils/symmetricEncryptionDecryption.js';
import errorHandler from '../utils/errorHandler.js';
import { getAsymmetricKeyPair } from '../utils/asymmetricEncryptionDecryption.js';
import listCountryMobileCodes from '../utils/listCountryMobileCodes.js';
import setResponseCookie from '../utils/setResponseCookie.js';
import { dnsConfigCache, type LRUCachedData } from '../utils/lruCache.js';
import checkStringParams from '../utils/checkStringParams.js';
import checkStringQueryParams from '../utils/checkStringQueryParams.js';
import type { portalConfigurationDataType } from '../types/apiResponseDataObjectType.js';
import generateJwtToken from '../utils/generateJwtToken.js';

// FUNCTION TO GET THE DNS CONFIGURATION DATA
export const getDnsConfig = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("portal_configurations");
        if (isCollectionPresent.status !== "SUCCESS") {
            return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Required collection does not exist in MongoDB" });
        }

        // Validate X-API-Key header
        const xApiKey: string | null = checkStringHeader(req, "x-api-key");
        if (!xApiKey) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'x-api-key MISSING OR NOT STRING" });
        }
        // Validate domain name in request body
        const domainName: string | null = checkStringQueryParams(req, "domainName");

        if (!domainName) {
            return res.status(400).json({ status: "INVALID_REQUEST_BODY_PARAMETER", message: "'domainName' MISSING OR NOT STRING" });
        }

        // Check cached DNS configuration data
        const cachedDnsConfigData: portalConfigurationDataType | undefined = dnsConfigCache.get(domainName);
        if (cachedDnsConfigData) {
            console.log("DNS configuration data fetched from cache", cachedDnsConfigData);
            return res.status(200).json({ status: "SUCCESS", message: "DNS config fetch successfully", data: cachedDnsConfigData });
        }

        // Fetch DNS configuration data from database
        const dnsData: portalConfigurationSchema | null = await portal_configurations.findOne({ dns_x_api_key: xApiKey, domain_name: domainName }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();

        // Cehck DNS Config Data
        if (!dnsData) {
            return res.status(404).json({ status: "NOT_FOUND", message: "DNS configuration not found" });
        }

        // Create Access Token
        const jwtToken = generateJwtToken(dnsData.domain_name);

        // Set Cookie
        // const setResponseCookieResult: successResponseJson = setResponseCookie(res, "token", jwtToken);
        // if (setResponseCookieResult.status.toUpperCase() !== "SUCCESS") {
        //     return res.status(400).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to set response cookie" });
        // }

        // Create response data
        const responseDnsData = {
            ...dnsData, 
            accessToken: jwtToken
        }

        // Set DNS configuration data in DNS configuration cache
        dnsConfigCache.set(domainName, responseDnsData);

        // INITIATE SESSION
        req.session.initiated = true;
        req.session.lastActivity = Date.now();
        
        // Set DNS data in session
        req.session.sessiondata = {
            domainName: dnsData.domain_name,
            agentCode: dnsData.agent_code,
            subAgentCode: dnsData.subagent_code,
            businessId: dnsData.business_id,
            programId: dnsData.program_id,
            clientId: dnsData.client_id,
            requestXApiKey: dnsData.x_api_key,
            accessToken: jwtToken || ""
        };

        // console.log("Session data: ", req.session);

        return res.status(200).json({ status: "SUCCESS", message: "DNS config fetch successfully", data: responseDnsData });
    }
    catch (error) {
        errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "GET DNS CONFIG FACING ISSUE.");
    }
}

// FUNCTION TO GET THE SYMMETRIC ENCRYPTION KEY
export const getEncryptionKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get the encryption key
        const encryptionKeyResponse = getSymmetricEncryptionKey(req);
        if (encryptionKeyResponse?.status.toUpperCase() === "SUCCESS") {
            return res.status(200).json({ status: "SUCCESS", key: encryptionKeyResponse.key });
        }
        else {
            return res.status(400).json({ status: "ERROR", message: "Failed to generate symmetric encryption key" });
        }
    }
    catch (error) {
        errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "GET ENCRYPTION KEY FACING ISSUE.");
    }
}

// FUNCTION TO GET THE ASYMMETRIC ENCRPTION PUBLIC KEY
export const getPublicKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        // Get public encryption key
        const publicKeyResponse = getAsymmetricKeyPair(req);
        if (publicKeyResponse?.status.toUpperCase() === "SUCCESS") {
            return res.status(200).json({ status: "SUCCESS", key: publicKeyResponse.publicKey });
        }
        else {
            return res.status(400).json({ status: "ERROR", message: "Failed to generate asymeetric public key" });
        }
    }
    catch (error) {
        errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "GET PUBLIC KEY FACING ISSUE.");
    }
}

// FUNCTION TO GET THE MOBILE COUNTRY CODES
export const getMobileCountryCodes = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    try {
        const mobileCountryCodesResponse = listCountryMobileCodes();
        if (mobileCountryCodesResponse?.status.toUpperCase() === "SUCCESS") {
            return res.status(200).json({ status: "SUCCESS", data: mobileCountryCodesResponse.data });
        }
        else {
            return res.status(400).json({ status: "ERROR", message: "Failed to fetch mobile country codes" });
        }
    }
    catch (error) {
        errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "GET MOBILE COUNTRY CODES FACING ISSUE.");
    }
}