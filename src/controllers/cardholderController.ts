import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { getCardholderDetailsService, getCardholderListService } from "../services/cardholderService.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

// ------------------------------------------ FUNCTION TO GET CARDHOLDER LIST ------------------------------------------ \\
export const getCardholderList = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        // Get user configuration from headers
        const userConfigurations = {
            businessId: req.headers["business-id"] as string,
            programId: req.headers["program-id"] as string,
            agentCode: req.headers["agent-code"] as string,
            subAgentCode: req.headers["subagent-code"] as string
        }

        const getCardholderListServiceResponse = await getCardholderListService(requestSession, aesDecryptedQueryData, userConfigurations)
        if (getCardholderListServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user cardholder list", 400);
        }
        return res.success("Cardholder list fetched successfully", getCardholderListServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardholderListController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetCardholderListController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO GET CARDHOLDER DETALS ------------------------------------------ \\
export const getCardholderDetails = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        // Get user configuration from headers
        const userConfigurations = {
            businessId: req.headers["business-id"] as string,
            programId: req.headers["program-id"] as string,
            agentCode: req.headers["agent-code"] as string,
            subAgentCode: req.headers["subagent-code"] as string
        }

        const getCardholderDetailsServiceResponse = await getCardholderDetailsService(requestSession, aesDecryptedQueryData, userConfigurations, req.params.id)
        if (getCardholderDetailsServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user cardholder details", 400);
        }
        return res.success("Cardholder details fetched successfully", getCardholderDetailsServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardholderDetailsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetCardholderDetailsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\