import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, ServiceError, ServiceUnavailableError } from "../utils/AppErrorClass.js";
import { resendMailSendService } from "./resendMailService.js";
import dotenv from "dotenv"

dotenv.config();

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "paulcode1234@gmail.com"


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
export const sendEmailService = async (requestSession: Request["session"], type: string): Promise<successResponseJson> => {
    try {
        const toEmail: string = requestSession?.userEmail as string
        const sendEmail: string = fromEmail
        const mainConfig = {toEmail, sendEmail}
        const resendMailSendServiceResponse = await resendMailSendService(mainConfig)

        if (resendMailSendServiceResponse?.status !== "SUCCESS") {
            throw new ServiceError("ResendMailSendService is facing error")
        }
        return {status: "SUCCESS", data: resendMailSendServiceResponse?.id, message: "Email send using Resend email servicel"}
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }

        if (error instanceof Error) {
            throw error;
        }
        throw new ServiceUnavailableError("ResendMailSendService is unavailbale as facing issue.", error)
    }
}