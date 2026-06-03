import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { send2FaCodeService, sendResetPasswordCodeService, verify2FaCodeService, verifyEmailService } from "../services/twoFaService.js";
import { getRequestSession } from "../utils/requestContext.js";
import logger from "../utils/logger.js";

// ------------------------------------- FUNCTION TO VERIFY EMAIL ------------------------------------- \\
export const verifyEmail = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const verifyEmailServiceResponse = await verifyEmailService(requestSession, res, aesDecryptedBodyData)
        if (verifyEmailServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Email verification failed", 400);
        }
        return res.success("Email verification successfull", {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "VerifyEmailController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `VerifyEmailController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO SEND EMAIL ------------------------------------- \\
export const send2FaVerificationCode = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const send2FaCodeServiceResponse = await send2FaCodeService(requestSession, res, aesDecryptedBodyData)
        if (send2FaCodeServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to send two factor auth verification code in email", 400);
        }

        if (send2FaCodeServiceResponse?.message === "Authenticator configuration generated") {
            return res.success("2Fa authenticator verification configuration created successfully", send2FaCodeServiceResponse?.data, 200)
        }
        else {
            return res.success("2Fa verification code sent to email successfully", {}, 200)
        }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "Send2FaVerificationCodeController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `Send2FaVerificationCodeController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO VERIFY TWO FACTOR AUTH ------------------------------------- \\
export const verify2FaCode = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const verifyEmailServiceResponse = await verify2FaCodeService(requestSession, res, aesDecryptedBodyData)
        if (verifyEmailServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Two factor auth code verification failed", 400);
        }
        return res.success("Two factor auth code verification successfull", {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "Verify2FaCodeController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `Verify2FaCodeController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO SEND RESET PASSWORD VERIFICATION CODE ------------------------------------- \\
export const sendResetPasswordVerificationCode = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const send2FaCodeServiceResponse = await sendResetPasswordCodeService(req.session, res, aesDecryptedBodyData)
        if (send2FaCodeServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to send reset password verification code in email", 400);
        }

        return res.success("Reset password verification code sent to email successfully", {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SendResetPasswordVerificationCodeController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `SendResetPasswordVerificationCodeController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO VERIFY RESET PASSWORD CODE ------------------------------------- \\
export const verifyResetPasswordCode = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const verifyEmailServiceResponse = await verify2FaCodeService(req.session, res, aesDecryptedBodyData)
        if (verifyEmailServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Reset password code verification failed", 400);
        }
        return res.success("Reset password code verification successfull", {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "VerifyResetPasswordCodeController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `VerifyResetPasswordCodeController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\