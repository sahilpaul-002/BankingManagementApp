// import "dotenv/config";
// import nodemailer from "nodemailer";
// import { AppErrorClass, ExternalServiceError, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
// import logger from "../utils/logger.js";
// import sanitizeApiError from "../utils/sanitizeApiError.js";

// const gmailServiceXApiKey = process.env.MAIL_GMAIL_X_API_KEY
// const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL || "nodemailtesting02@gmail.com"

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: fromEmail,
//         pass: gmailServiceXApiKey,
//     },
// });

// interface mainConfigType {
//     toEmail: string
//     sendEmail: string
//     dashboardName: string
//     emailTemplate: any
// }

// export const gmailSendService = async (mailConfig: mainConfigType) => {
//     try {
//         const { toEmail, sendEmail, dashboardName, emailTemplate } = mailConfig;

//         // Check mail config
//         if (!toEmail) {
//             throw new NotFoundError("GmailSendService faced error - sending and receiving mail not found")
//         }

//         const sendEmailResponse = await transporter.sendMail({
//             from: `"${dashboardName}" <${fromEmail}>`,
//             to: toEmail,
//             subject: emailTemplate?.subject || "Test Email",
//             html: emailTemplate?.html || `
//             <h1>Test Email Template</h1>
//             <p>Email is working successfully.</p>
//         `,
//         });

//         // if (!sendEmailResponse?.response || !sendEmailResponse?.messageId || !sendEmailResponse?.response.includes("250") || !sendEmailResponse?.response.includes("OK")) {
//         //     throw new ExternalServiceError("GmailSendService faced error - failed to send email")
//         // }
//         if (sendEmailResponse?.response && sendEmailResponse?.messageId && sendEmailResponse?.response.includes("250") && sendEmailResponse?.response.includes("OK")) {
//             return { status: "SUCCESS", id: sendEmailResponse?.messageId };
//         }

//         throw new ExternalServiceError("GmailSendService faced error - failed to send email")
//     }
//     catch (err) {
//         const error = err as any;
//         // const url = req?.path || "UNKNOWN_URL";
//         const errorStatus = error?.status || "UnknownErrorStatus";

//         logger.error(error, {
//             serviceName: "GmailSendService",
//             // url: req.path,
//             // method: req.method
//         });

//         const sanitizedError = sanitizeApiError(error);

//         if (error instanceof AppErrorClass) {
//             throw error;
//         }
//         throw new ServiceError(
//             `GmailSendService facing issue`, sanitizedError);
//     }
// }


import "dotenv/config";
import nodemailer from "nodemailer";
import { google } from "googleapis";

import {
    AppErrorClass,
    ExternalServiceError,
    NotFoundError,
    ServiceError,
} from "../utils/AppErrorClass.js";

import logger from "../utils/logger.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

const fromEmail = process.env.MAIL_SERVICE_SENDING_EMAIL
    || "nodemailtesting02@gmail.com";

// Local development: Gmail SMTP
const smtpTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: fromEmail,
        pass: process.env.MAIL_GMAIL_X_API_KEY,
    },
});

// Production: Gmail API over HTTPS
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN ?? null,
});

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
});

interface MainConfigType {
    toEmail: string;
    sendEmail: string;
    dashboardName: string;
    emailTemplate: {
        subject?: string;
        html?: string;
    };
}

const sendUsingSmtp = async (mailConfig: MainConfigType) => {
    const { toEmail, dashboardName, emailTemplate } = mailConfig;

    const response = await smtpTransporter.sendMail({
        from: `"${dashboardName}" <${fromEmail}>`,
        to: toEmail,
        subject: emailTemplate?.subject || "Test Email",
        html: emailTemplate?.html || "<p>Email is working successfully.</p>",
    });

    if (!response.messageId || !response.response?.includes("250")) {
        throw new ExternalServiceError(
            "Gmail SMTP failed to send email",
        );
    }

    return {
        status: "SUCCESS" as const,
        id: response.messageId,
    };
};

const sendUsingGmailApi = async (mailConfig: MainConfigType) => {
    const { toEmail, dashboardName, emailTemplate } = mailConfig;

    const subject = emailTemplate?.subject || "Test Email";
    const html = emailTemplate?.html
        || "<p>Email is working successfully.</p>";

    // Construct a MIME message and encode it as base64URL.
    const mimeMessage = [
        `From: "${dashboardName}" <${fromEmail}>`,
        `To: ${toEmail}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(html, "utf8").toString("base64"),
    ].join("\r\n");

    const raw = Buffer.from(mimeMessage, "utf8")
        .toString("base64url");

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
    });

    if (!response.data.id) {
        throw new ExternalServiceError(
            "Gmail API failed to send email",
        );
    }

    return {
        status: "SUCCESS" as const,
        id: response.data.id,
    };
};

export const gmailSendService = async (
    mailConfig: MainConfigType,
) => {
    try {
        if (!mailConfig.toEmail) {
            throw new NotFoundError(
                "GmailSendService: recipient email not found",
            );
        }

        // Production uses Gmail API; local development uses SMTP.
        if (process.env.NODE_ENV !== "development") {
            return await sendUsingGmailApi(mailConfig);
        }

        return await sendUsingSmtp(mailConfig);
    } catch (err: any) {
        logger.error(err, {
            serviceName: "GmailSendService",
        });

        if (err instanceof AppErrorClass) {
            throw err;
        }

        const sanitizedError = sanitizeApiError(err);

        throw new ServiceError(
            "GmailSendService facing issue",
            sanitizedError,
        );
    }
};