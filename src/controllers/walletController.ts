import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { createWalletCurrencyConversionQuoteService, createWalletService, executeWalletCurrencyConversionQuoteService, getWalletService, getWalletTransactionDetailsService, getWalletTransactionsService, loadWalletService, withdrawWalletService } from "../services/walletServices.js";

// ------------------------------------------ FUNCTION TO GET WALLET ------------------------------------------ \\
export const getWallet = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getWalletServiceResponse = await getWalletService(requestSession, aesDecryptedQueryData, userConfigurations)
        if (getWalletServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user wallet details", 400);
        }
        return res.success("User wallet details fetched successfully", getWalletServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetWalletController",
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
        throw new ServiceUnavailableError("GetWalletController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\

// ------------------------------ FUNCTION TO PERFORM CREATE WALLET ------------------------------ \\
export const createWallet = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query

        // Get request session
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

        const createWalletServiceResponse = await createWalletService(requestSession, aesDecryptedBodyData, userConfigurations);

        if (createWalletServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Create wallet service is facing issue", 400);
        }

        return res.success("Wallet created successfully.", createWalletServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateWalletController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `CreateWalletController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM LOAD WALLET ------------------------------ \\
export const loadWallet = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query

        // Get request session
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

        const loadWalletServiceResponse = await loadWalletService(requestSession, aesDecryptedBodyData, userConfigurations);

        if (loadWalletServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Load wallet service is facing issue", 400);
        }

        return res.success("Wallet loaded successfully.", loadWalletServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "LoadWalletController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `LoadWalletController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM WITHDRAW WALLET ------------------------------ \\
export const withdrAawWallet = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query

        // Get request session
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

        const loadWalletServiceResponse = await withdrawWalletService(requestSession, aesDecryptedBodyData, userConfigurations);

        if (loadWalletServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Withdraw wallet service is facing issue", 400);
        }

        return res.success("Ammount withdraw from wallet successfully.", loadWalletServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "withdrawWalletController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `withdrawWalletController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------------------ FUNCTION TO GET WALLET TRANSACTIONS ------------------------------------------ \\
export const getWalletTransactions = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getWalletTransactionServiceResponse = await getWalletTransactionsService(requestSession, aesDecryptedQueryData, userConfigurations)
        if (getWalletTransactionServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user wallet transactions", 400);
        }
        return res.success("User wallet transactions fetched successfully", getWalletTransactionServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetWalletTransactionsController",
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
        throw new ServiceUnavailableError("GetWalletTransactionsController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------ FUNCTION TO GET WALLET TRANSACTION DETAILS ------------------------------------ \\
export const getWalletTransactionDetails = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getWalletTransactionDetailsServiceResponse = await getWalletTransactionDetailsService(requestSession, aesDecryptedQueryData, userConfigurations, req.params.id)
        if (getWalletTransactionDetailsServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user wallet transaction details", 400);
        }
        return res.success("User wallet transaction details fetched successfully", getWalletTransactionDetailsServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetWalletTransactionDetailsController",
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
        throw new ServiceUnavailableError("GetWalletTransactionDetailsController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ---------------------------- FUNCTION TO CREATE WALLET CURRENCU CONVERSIONPAYOUT QUOTE ---------------------------- \\
export const createWalletCurrencyConversionPayoutQuote = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const createPayoutQuoteServiceResponse = await createWalletCurrencyConversionQuoteService(requestSession, aesDecryptedQueryData, aesDecryptedBodyData, userConfigurations)
        if (createPayoutQuoteServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to create wallet currency conversion payout quote", 400);
        }
        return res.success("Payout quote for wallet currency conversion created successfully", createPayoutQuoteServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateWalletCurrencyCOnversionPayoutQuoteController",
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
        throw new ServiceUnavailableError("CreateWalletCurrencyCOnversionPayoutQuoteController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO EXECUTE WALLET CURRENCY CONVERSION PAYOUT QUOTE ------------------------------------------ \\
export const executeWalletCurrencyConversionPayoutQuote = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const executePayoutQuoteServiceResponse = await executeWalletCurrencyConversionQuoteService(requestSession, aesDecryptedQueryData, aesDecryptedBodyData, userConfigurations)
        if (executePayoutQuoteServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to execute wallet currency conversion payout quote", 400);
        }
        return res.success("Wallet currency conversion payout quote executed successfully", executePayoutQuoteServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "ExecuteWalletCurrencyConversionPayoutQuoteController",
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
        throw new ServiceUnavailableError("ExecuteWalletCurrencyConversionPayoutQuoteController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\