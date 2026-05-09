import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { resendMailSendService } from "./resendMailService.js";
import dotenv from "dotenv"
import logger from "../utils/logger.js";
import { gmailSendService } from "./gmailSendService.js";

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"


// VERIFY EMAIL SERVICE
// export const verifyEmailService = async (requestSession: Request["session"], res: Response, aesDecryptedBodyData: Record<string, string> | undefined): Promise<Response<successResponseJson>> => {
//     try {
//         return {status: "SUCCESS", message: ""}
//     }
//     catch (error) {
//         if (error instanceof AppErrorClass) {
//             throw error; // ✅ preserve original error
//         }

//         if (error instanceof Error) {
//             throw error;
//         }
//         throw new Error("UserSignIn is facing issue.")
//     }
// }

// SEND EMAIL SERVICE
export const sendEmailService = async (requestSession: Request["session"], userMail: string, type: string, emailTemplate: any): Promise<successResponseJson> => {
    try {
        const toEmail: string = userMail
        const sendEmail: string = fromEmail
        const dashboardName: string = requestSession?.sessiondata?.dashboardName || "BMA"
        const mainConfig = { toEmail, sendEmail, dashboardName, emailTemplate }
        // const resendMailSendServiceResponse = await resendMailSendService(mainConfig)
        const gmailMailServiceResponse = await gmailSendService(mainConfig)

        if (gmailMailServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("GmailSendService is facing error")
        }
        return { status: "SUCCESS", data: gmailMailServiceResponse?.id, message: "Email send using service" }
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GmailSendService",
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
        throw new ServiceUnavailableError("GmailSendService is unavailbale as facing unknown issue.", error)
    }
}