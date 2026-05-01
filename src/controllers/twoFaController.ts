import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, UnauthenticatedError } from "../utils/AppErrorClass.js";
import { sendEmailService } from "../services/twoFaService.js";
import { getRequestSession } from "../utils/requestContext.js";

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
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }

        if (error instanceof Error) {
            throw error;
        }
        throw new Error("GetEncryptionKey is facing issue.")
    }
}