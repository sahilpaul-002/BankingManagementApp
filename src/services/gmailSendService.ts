import "dotenv/config";
import nodemailer from "nodemailer";
import { AppErrorClass, ExternalServiceError, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

const gmailServiceXApiKey = process.env.MAIL_GMAIL_X_API_KEY
const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: fromEmail,
        pass: gmailServiceXApiKey,
    },
});

interface mainConfigType {
    toEmail: string
    sendEmail: string
    dashboardName: string
    emailTemplate: any
}

export const gmailSendService = async (mailConfig: mainConfigType) => {
    try {
        const { toEmail, sendEmail, dashboardName, emailTemplate } = mailConfig;

        // Check mail config
        if (!toEmail) {
            throw new NotFoundError("GmailSendService faced error - sending and receiving mail not found")
        }

        const sendEmailResponse = await transporter.sendMail({
            from: `"${dashboardName}" <${fromEmail}>`,
            to: toEmail,
            subject: emailTemplate?.subject || "Test Email",
            html: emailTemplate?.html || `
            <h1>Test Email Template</h1>
            <p>Email is working successfully.</p>
        `,
        });

        // if (!sendEmailResponse?.response || !sendEmailResponse?.messageId || !sendEmailResponse?.response.includes("250") || !sendEmailResponse?.response.includes("OK")) {
        //     throw new ExternalServiceError("GmailSendService faced error - failed to send email")
        // }
        if (sendEmailResponse?.response && sendEmailResponse?.messageId && sendEmailResponse?.response.includes("250") && sendEmailResponse?.response.includes("OK")) {
            return { status: "SUCCESS", id: sendEmailResponse?.messageId };
        }

        throw new ExternalServiceError("GmailSendService faced error - failed to send email")
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }
        throw new ServiceError(
            `GmailSendService facing issue`, sanitizedError);
    }
}