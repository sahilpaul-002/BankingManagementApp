import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { sendEmailService } from "../services/twoFaService.js";
import { getRequestSession } from "../utils/requestContext.js";
import logger from "../utils/logger.js";

// FUNCTION TO VERIFY EMAIL
export const verifyEmail = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }
        const sendEmailServiceResponse = await sendEmailService(requestSession, "EMAIL_OTP")
        if (sendEmailServiceResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "getDnsConfigService facing isssue", 400);
        }
        return res.success("Email send using 'Resend' service", sendEmailServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "VerifyEmailController",
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
                    error
                );
            }
        }
        throw new ServiceUnavailableError("VerifyEmailController is facing unknown issue.", error)
    }
}