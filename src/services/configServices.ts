import { response, type Request, type Response } from "express"
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import type { portalConfigurationDataType } from "../types/apiResponseDataObjectType.js";
import { dnsConfigCache } from "../utils/lruCache.js";
import type { portalConfigurationSchemaTypes } from "../types/schemaTypes.js";
import { portalConfigurationsModel as portal_configurations } from "../models/portal_configurations.js";
import generateJwtToken from "../utils/generateJwtToken.js";
import normalizeIp from "../utils/normalizeIp.js";
import type { ParsedQs } from "qs";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { getSymmetricEncryptionKey } from "../utils/symmetricEncryptionDecryption.js";
import { getAsymmetricKeyPair } from "../utils/asymmetricEncryptionDecryption.js";
import listCountryMobileCodes from "../utils/listCountryMobileCodes.js";
import { getHeaderAsymmetricKeyPair } from "../utils/asymmetricHeaderEncryptionDecryption.js";
import dotenv from "dotenv"
import { DNS_CONFIG_X_API_KEYS } from "../configs/configConstants.js";
import logger from "../utils/logger.js";

dotenv.config();

// --------------------------------------- GET DNS CONFIG SERVICE --------------------------------------- \\
export const resolveDomain = (origin?: string): string => {
    if (!origin) {
        return "";
    }

    if (origin.includes("localhost")) {
        return "business.banking-management.com";
    }

    return origin.split("//")[1] || "";
};
export const getDnsConfigService = async (req: Request, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }
        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("portal_configurations");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new AppErrorClass(
                404,
                "NOT_FOUND",
                "Required collection does not exist in MongoDB"
            );
        }

        // Validate domain name in request body
        const frontendDomain: string | null = checkStringQueryParams(aesDecryptedQueryData, "domainName");

        if (!frontendDomain) {
            throw new AppErrorClass(
                406,
                "INVALID_REQUEST_QUERY_PARAMETER",
                "'domainName' MISSING OR NOT STRING"
            );
        }

        // Get resoved domain
        const domainName = resolveDomain(frontendDomain);

        // Validate X-API-Key header
        // const xApiKey: string | null = checkStringHeader(req.headers, "dns-x-api-key");
        const xApiKey: string | undefined = DNS_CONFIG_X_API_KEYS[domainName];
        if (!xApiKey) {
            throw new AppErrorClass(
                400,
                "INVALID_HEADER",
                "'dns-x-api-key MISSING OR NOT STRING"
            );
        }

        // Check cached DNS configuration data
        const cachedDnsConfigData: portalConfigurationDataType | undefined = dnsConfigCache.get(domainName);
        if (cachedDnsConfigData && req.session.initiated && req.session.lastActivity && req.session.sessiondata && req.session.meta) {
            console.log("DNS configuration data fetched from cache", cachedDnsConfigData);
            return { status: "SUCCESS", message: "DNS config fetch successfully", data: cachedDnsConfigData }
        }

        // Fetch DNS configuration data from database
        const dnsData: portalConfigurationSchemaTypes | null = await portal_configurations.findOne({ dns_x_api_key: xApiKey, domain_name: domainName }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();

        // Cehck DNS Config Data
        if (!dnsData) {
            throw new NotFoundError("DNS configuration not found")
        }

        // Create Access Token
        const jwtAccessToken = generateJwtToken(dnsData.domain_name);

        // Create response data
        const responseDnsData = {
            ...dnsData,
            accessToken: jwtAccessToken
        }

        // Set DNS configuration data in DNS configuration cache
        dnsConfigCache.set(domainName, responseDnsData);

        // INITIATE SESSION
        req.session.initiated = true;
        req.session.lastActivity = Date.now();

        // Set DNS data in session
        req.session.sessiondata = {
            domainName: dnsData.domain_name,
            dashboardName: dnsData.dashboard_name,
            baseUrl: dnsData?.base_url_api,
            agentCode: dnsData.agent_code,
            subAgentCode: dnsData.subagent_code,
            businessId: dnsData.business_id,
            programId: dnsData.program_id,
            clientId: dnsData.client_id,
            requestXApiKey: dnsData.x_api_key,
            accessToken: jwtAccessToken || ""
        };

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

        // Store client IP and device id in session meta
        req.session.meta = {
            ...req.session.meta,
            clientIp: clientIp as string,
            deviceId: deviceId as string,
        }

        // console.log("Session data: ", req.session);
        return { status: "SUCCESS", message: "DNS config fetch successfullly", data: responseDnsData };
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetDnsConfigService",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetDnsConfigService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

// GET SYMMETRIC AES ENCRYPTION KEY SERVICE
export const getAesEncryptionKeyService = (req: Request): successResponseJson => {
    try {
        // Get the encryption key
        const encryptionKeyResponse = getSymmetricEncryptionKey(req);
        if (encryptionKeyResponse?.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("Failed to generate symmetric encryption key")
        }

        return { status: "SUCCESS", data: encryptionKeyResponse.key as string, message: "Encryption key fetch successfully" }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetEncryptionKeyService",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetEncryptionKeyService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

// GET SYMMETRIC AES ENCRYPTION KEY SERVICE
export const getRsaPublicKeyService = (req: Request): successResponseJson => {
    try {
        // Get public encryption key
        const publicKeyResponse = getAsymmetricKeyPair(req);
        if (publicKeyResponse?.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("Failed to generate asymeetric public key")
        }

        return { status: "SUCCESS", data: publicKeyResponse.publicKey, message: "Public key fetch successfully" }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetRsaPublicKeyService",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetRsaPublicKeyService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

// GET MOBILE COUNTRY CODES SERVICE
export const getMobileCountryCodesService = (req: Request): successResponseJson => {
    try {
        const mobileCountryCodesResponse = listCountryMobileCodes();
        if (mobileCountryCodesResponse?.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("Failed to fetch mobile country codes")
        }
        return { status: "SUCCESS", data: mobileCountryCodesResponse.data as object, message: "Mobile country codes fetch successfully" }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetMobileCountryCodesService",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetMobileCountryCodesService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

// GET HEADER ASYMMMETRIC ENCRYPTION PUBLIC KEY SERVICE
export const getHeaderPublicKeyService = (req: Request): successResponseJson => {
    try {
        // Get public encryption key
        const publicKeyResponse = getHeaderAsymmetricKeyPair(req);
        if (publicKeyResponse?.status.toUpperCase() !== "SUCCESS") {
            throw new ServiceError("Failed to generate asymeetric public key")
        }

        return { status: "SUCCESS", data: publicKeyResponse?.publicKey as string, message: "Public key fetch successfully" }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetHeaderPublicKeyService",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetHeaderPublicKeyService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}