import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { getKycService, uploadKycService } from "../services/kycServices.js";

// FUNCTION TO GET KYC
export const getKyc = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const getKycServiceResponse = await getKycService(requestSession, res, aesDecryptedBodyData)
        if (getKycServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user kyc details", 400);
        }
        return res.success("User kyc details fetched successfully", getKycServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetKycController",
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
        throw new ServiceUnavailableError("GetKycController is facing unknown issue.", error)
    }
}

// FUNCTION TO GET KYC
export const uploadKyc = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const uploadKycServiceResponse = await uploadKycService(req, res, aesDecryptedBodyData)
        if (uploadKycServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user kyc details", 400);
        }
        return res.success("User kyc details uploaded successfully", uploadKycServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UploadKycController",
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
        throw new ServiceUnavailableError("UploadKycController is facing unknown issue.", error)
    }
}