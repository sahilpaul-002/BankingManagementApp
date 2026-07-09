import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { createCardService, getCardDetailsService, getCardsListService, updateCardLimitsService, updateCardStatusService } from "../services/cardService.js";

// ------------------------------------------ FUNCTION TO CREATE CARD ------------------------------------------ \\
export const createCard = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const createCardResponse = await createCardService(requestSession, aesDecryptedBodyData)
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
        throw new ServiceUnavailableError("CreateCardController is facing unknown issue.", error)
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

        const getCardsListResponse = await getCardsListService(requestSession, aesDecryptedQueryData)
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
        throw new ServiceUnavailableError("GetCardsListController is facing unknown issue.", error)
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

        const getCardDetailsResponse = await getCardDetailsService(requestSession, aesDecryptedQueryData, req.params.id)
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
        throw new ServiceUnavailableError("GetCardDetailsController is facing unknown issue.", error)
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

        const updateCardDetailsResponse = await updateCardStatusService(requestSession, aesDecryptedBodyData, req.params.id)
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
        throw new ServiceUnavailableError("UpdateCardStatusController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\


// ------------------------------------------ FUNCTION TO UPDATE CARD STATUS ------------------------------------------ \\
export const updateCardLimits = async (req: Request<{ id?: string }>, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const updateCardDetailsResponse = await updateCardLimitsService(requestSession, aesDecryptedBodyData, req.params.id)
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
        throw new ServiceUnavailableError("UpdateCardLimitsController is facing unknown issue.", error)
    }
}
// --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\