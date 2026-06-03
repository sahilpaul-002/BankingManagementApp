import { Resend } from "resend";
import dotenv from "dotenv";
import { AppErrorClass, ExternalServiceError, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";

dotenv.config();

const resendMailServiceXApiKey = process.env.MAIL_RESEND_X_API_KEY

const resend = new Resend(resendMailServiceXApiKey);


interface mainConfigType {
    toEmail: string
    sendEmail: string
}

export const resendMailSendService = async (mailConfig: mainConfigType) => {
    try {
        const { toEmail, sendEmail } = mailConfig;

        // Check mail config
        if (!toEmail || !sendEmail) {
            throw new NotFoundError("ResendMailSendService faced error - sending and receiving mail not found")
        }

        const { data, error } = await resend.emails.send({
            from: sendEmail,
            to: [toEmail],
            subject: "Test",
            // html: `<p>${message}</p>`,
            html: `<p>This is test email.</p>`,
        });

        if (error) {
            // res.status(500).json({ error: error.message });
            // return;
            throw new ExternalServiceError("ResendMailSendService is facing issue", error);
        }

        return { status: "SUCCESS", id: data?.id };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "ResendMailSendService",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `ResendMailSendService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}