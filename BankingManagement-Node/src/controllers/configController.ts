import type { Request, Response } from 'express';
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { portalConfigurationSchema } from '../types/schemaTypes.js';
import { portalConfigurationsModel as portal_configurations } from "../models/portal_configurations.js";
import checkMongoDbCollectionExist from '../utils/checkMongoDbCollectionExist.js';
import checkStringHeader from '../utils/checkStringHeader.js';
import checkStringBody from '../utils/checkStringBody.js';
import { getSymmetricEncryptionKey } from '../utils/symmetricEncryptionDecryption.js';
import type { SessionData } from 'express-session';

export const getDnsConfig = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson>> => {
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
        const domainName: string | null = checkStringBody(req, "domainName");
        if (!domainName) {
            return res.status(400).json({ status: "INVALID_REQUEST_BODY_PARAMETER", message: "'domainName' MISSING OR NOT STRING" });
        }

        const dnsData: portalConfigurationSchema | null = await portal_configurations.findOne({ dns_x_api_key: xApiKey, domain_name: domainName }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();

        // Cehck DNS Config Data
        if (!dnsData) {
            return res.status(404).json({ status: "NOT_FOUND", message: "DNS configuration not found" });
        }

        return res.status(200).json({ status: "SUCCESS", message: "DNS config fetch successfully", data: dnsData });
    }
    catch (error) {
        console.error("getDnsConfig error:", error);

        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
    }
}

export const getEncryptionKey = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> => {
    try {
        // Get the encryption key
        const encryptionKeyResponse = getSymmetricEncryptionKey(req);
        if (encryptionKeyResponse?.status.toLowerCase() === "success") {
            return res.status(200).json({ status: "SUCCESS", key: encryptionKeyResponse.key });
        }
        else {
            return res.status(400).json({ status: "ERROR", message: "Failed to generate web crypto key" });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({ status: "BAD_REQUEST", message: "Internal Server Error" });
    }
}