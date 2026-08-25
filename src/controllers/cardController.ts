import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { cardTransactionAuthorizationWebhookService, createCardService, createCardTransactionService, getCardDetailsService, getCardsListService, getCardTransactionDetailsService, getCardTransactionsService, updateCardLimitsService, updateCardStatusService } from "../services/cardService.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

// ------------------------------------------ FUNCTION TO CREATE CARD ------------------------------------------ \\
export const createCard = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const createCardResponse = await createCardService(requestSession, aesDecryptedBodyData, userConfigurations)
        if (createCardResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Create card service faled to create card", 400);
        }
        return res.success("Card created successfully", createCardResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateCardController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("CreateCardController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO GET CARDS LIST ------------------------------------------ \\
export const getCardsList = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getCardsListResponse = await getCardsListService(requestSession, aesDecryptedQueryData, userConfigurations)
        if (getCardsListResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to get cards list", 400);
        }
        return res.success("Cards list fetched successfully", getCardsListResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardsListController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetCardsListController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO GET CARD DETAILS ------------------------------------------ \\
export const getCardDetails = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getCardDetailsResponse = await getCardDetailsService(requestSession, aesDecryptedQueryData, userConfigurations, req.params.id)
        if (getCardDetailsResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch card details", 400);
        }
        return res.success("Card details fetched successfully", getCardDetailsResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardDetailsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetCardDetailsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO UPDATE CARD STATUS ------------------------------------------ \\
export const updateCardStatus = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const updateCardDetailsResponse = await updateCardStatusService(requestSession, aesDecryptedBodyData, userConfigurations, req.params.id)
        if (updateCardDetailsResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to update card status", 400);
        }
        return res.success("Card status updated successfully", updateCardDetailsResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UpdateCardStatusController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("UpdateCardStatusController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO UPDATE CARD LIMITS ------------------------------------------ \\
export const updateCardLimits = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const updateCardDetailsResponse = await updateCardLimitsService(requestSession, aesDecryptedBodyData, userConfigurations, req.params.id)
        if (updateCardDetailsResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to update card limits", 400);
        }
        return res.success("Card limits updated successfully", updateCardDetailsResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UpdateCardLimitsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("UpdateCardLimitsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO GET CARD TRANSACTIONS ------------------------------------------ \\
export const getCardTransactions = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getCardTransactionServiceResponse = await getCardTransactionsService(requestSession, aesDecryptedQueryData, userConfigurations)
        if (getCardTransactionServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user card transactions", 400);
        }
        return res.success("User card transactions fetched successfully", getCardTransactionServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardTransactionsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetCardTransactionsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------ FUNCTION TO GET CARD TRANSACTION DETAILS ------------------------------------ \\
export const getCardTransactionDetails = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
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

        const getCardTransactionDetailsServiceResponse = await getCardTransactionDetailsService(requestSession, aesDecryptedQueryData, userConfigurations, req.params.id)
        if (getCardTransactionDetailsServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user card transaction details", 400);
        }
        return res.success("User card transaction details fetched successfully", getCardTransactionDetailsServiceResponse?.data || {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetCardTransactionDetailsController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("GetCardTransactionDetailsController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// -------------------------------------- FUNCTION TO CREATE CARD TRANSACTIONS -------------------------------------- \\
export const createCardTransaction = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const createCardTransactionResponse = await createCardTransactionService(requestSession, aesDecryptedBodyData)
        if (createCardTransactionResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to create card transaction", 400);
        }
        return res.success("Card transaction created successfully", createCardTransactionResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreateCardTransactionController",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError("CreateCardTransactionController is facing unknown issue.", sanitizedError)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------- FUNCTION TO GET CARD TRANSACTION SETTLEMENT WEBHOOK ------------------------------------- \\
export const cardTransactionSettlementWebhook = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;

        const cardTransactionSettlementServiceResponse = await cardTransactionAuthorizationWebhookService(aesDecryptedQueryData)
        if (cardTransactionSettlementServiceResponse?.status !== "SUCCESS") {
            if (cardTransactionSettlementServiceResponse?.message === "Authorization request has expired") {
                return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>KYC Verification Expired</h2>
                    <p>
                        This card transaction authorization has been expired.
                    </p>
                    <p>
                        You can now close this tab.
                    </p>
                </body>
            </html>
        `
                );
            }
            else {
                throw new ServiceError("Failed to authorize card transaction mail webhook")
            }
        }

        if (cardTransactionSettlementServiceResponse?.message === "Transaction approved successfully") {
            return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>KYC Approved Successfully</h2>
                    <p>
                        The card transaction authorization request has been processed.
                    </p>
                    <p>
                        You can now close this tab.
                    </p>
                </body>
            </html>
        `
            );
        }
        else if (cardTransactionSettlementServiceResponse?.message === "Transaction rejected successfully") {
            return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>KYC Rejected Successfully</h2>
                    <p>
                        The card transaction authorization request has been processed.
                    </p>
                    <p>
                        You can now close this tab.
                    </p>
                </body>
            </html>
        `
            );
        }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CardTransactionSettlementWebhookController",
            url: req.path,
            method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(`CardTransactionSettlementWebhookController facing issue`, sanitizedError);
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\