import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { createPayoutQuoteService, executePayoutQuoteService, getPayoutQuoteTransactionDetailsService, getPayoutQuoteTransactionsService } from "../services/transferService.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

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

        const createPayoutQuoteServiceResponse = await createPayoutQuoteService(requestSession, aesDecryptedQueryData, aesDecryptedBodyData, userConfigurations)
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("CreatePayoutQuoteController is facing unknown issue.", sanitizedError)
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

        const executePayoutQuoteServiceResponse = await executePayoutQuoteService(requestSession, aesDecryptedQueryData, aesDecryptedBodyData, userConfigurations)
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("ExecutePayoutQuoteController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------ FUNCTION TO GET PAYOUT QUOTE TRANSACTIONS ------------------------------------ \\
export const getPayoutQuoteTransactions = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getPayoutQuoteTransactionServiceResponse = await getPayoutQuoteTransactionsService(requestSession, aesDecryptedQueryData, userConfigurations)
        if (getPayoutQuoteTransactionServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch payout quote transactions", 400);
        }
        return res.success("Payout quote transactions fetched successfully", getPayoutQuoteTransactionServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetPayoutQuoteTransactionsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetPayoutQuoteTransactionsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// -------------------------------- FUNCTION TO GET PAYOUT QUOTE TRANSACTION DETAILS -------------------------------- \\
export const getPayoutQuoteTransactionDetails = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getPayoutQuoteTransactionDetailsServiceResponse = await getPayoutQuoteTransactionDetailsService(requestSession, aesDecryptedQueryData, userConfigurations, req.params.id)
        if (getPayoutQuoteTransactionDetailsServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch payout quote transaction details", 400);
        }
        return res.success("Payout quote transaction details fetched successfully", getPayoutQuoteTransactionDetailsServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetPayoutQuoteTransactionDetailsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetPayoutQuoteTransactionDetailsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\