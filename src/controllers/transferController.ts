import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { createPayoutQuoteService, executePayoutQuoteService } from "../services/transferService.js";

// ------------------------------------------ FUNCTION TO CREATE PAYOUT QUOTE ------------------------------------------ \\
export const createPayoutQuote = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const createPayoutQuoteServiceResponse = await createPayoutQuoteService(requestSession, aesDecryptedBodyData, aesDecryptedBodyData, userConfigurations)
        if (createPayoutQuoteServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to create payout quote", 400);
        }
        return res.success("Payout quote created successfully", createPayoutQuoteServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreatePayoutQuoteController",
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
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("CreatePayoutQuoteController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO CREATE PAYOUT QUOTE ------------------------------------------ \\
export const executePayoutQuote = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const executePayoutQuoteServiceResponse = await executePayoutQuoteService(requestSession, aesDecryptedBodyData, aesDecryptedBodyData, userConfigurations)
        if (executePayoutQuoteServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to execute payout quote", 400);
        }
        return res.success("Payout quote executed successfully", executePayoutQuoteServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "ExecutePayoutQuoteController",
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
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("ExecutePayoutQuoteController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\