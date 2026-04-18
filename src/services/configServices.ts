import { response, type Request, type Response } from "express"
import { AppErrorClass } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import checkStringHeader from "../utils/checkStringHeader.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import type { portalConfigurationDataType } from "../types/apiResponseDataObjectType.js";
import { dnsConfigCache } from "../utils/lruCache.js";
import type { portalConfigurationSchemaTypes } from "../types/schemaTypes.js";
import { portalConfigurationsModel as portal_configurations } from "../models/portal_configurations.js";
import generateJwtToken from "../utils/generateJwtToken.js";
import normalizeIp from "../utils/normalizeIp.js";
import type { ParsedQs } from "qs";

// export const getDnsConfigService = async (req: Request, requestHeaders: Request["headers"], requestParams: Request["params"], requestQeury: Request["query"], requestBody: Request["body"]) => {
export const getDnsConfigService = async (req: Request, res: Response, aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined) => {
    try {
        if (!aesDecryptedQueryData) {
            throw new AppErrorClass(400, "BAD_REQUEST", "Invalid query data");
        }
        // Check if collection exist in MongoDB
        const isCollectionPresent = await checkMongoDbCollectionExist("portal_configurations");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new AppErrorClass(
                400,
                "NOT_FOUND",
                "Required collection does not exist in MongoDB"
            );
        }

        // Validate X-API-Key header
        const xApiKey: string | null = checkStringHeader(req.headers, "dns-x-api-key");
        if (!xApiKey) {
            throw new AppErrorClass(
                400,
                "INVALID_HEADER",
                "'x-api-key MISSING OR NOT STRING"
            );
        }
        // Validate domain name in request body
        const domainName: string | null = checkStringQueryParams(aesDecryptedQueryData, "domainName");

        if (!domainName) {
            throw new AppErrorClass(
                400,
                "INVALID_REQUEST_QUERY_PARAMETER",
                "'domainName' MISSING OR NOT STRING"
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
            throw new AppErrorClass(400, "NOT_FOUND", "DNS configuration not found")
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
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("GetDnsConfig is facing issue.")
    }
}