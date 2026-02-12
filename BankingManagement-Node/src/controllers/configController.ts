import type { Request, Response } from 'express';
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { portalConfigurationSchema } from '../types/schemaTypes.js';
import { portalConfigurationsModel as portal_configurations } from "../models/portal_configurations.js";
import checkMongoDbCollectionExist from '../utils/checkMongoDbCollectionExist.js';

export const getDnsConfig = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson>> => {
    // Check if collection exist in MongoDB
    const isCollectionPresent = await checkMongoDbCollectionExist("portal_configurations");
    if (isCollectionPresent.status !== "SUCCESS") {
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Required collection does not exist in MongoDB" });
    }

    const xApiKey: string = req.headers["x-api-key"] as string;

    // const dnsData: portalConfigurationSchema | null = await portal_configurations.findOne({ dns_x_api_key: xApiKey }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();
    const dnsData: portalConfigurationSchema | null = await portal_configurations.findOne({ dns_x_api_key: xApiKey }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();
    return res.status(200).json({ status: "SUCCESS", message: "DNS config fetch successfully", data: dnsData });
}