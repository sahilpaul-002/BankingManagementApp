import { Resend } from "resend";
import dotenv from "dotenv";
import { AppErrorClass, NotFoundError, ServiceError, ServiceUnavailableError } from "../utils/AppErrorClass.js";

dotenv.config();

const resendMailServiceXApiKey = process.env.MAIL_RESEND_X_API_KEY

const resend = new Resend(resendMailServiceXApiKey);

// const resendMailService = async () => {
//     const { data, error } = await resend.emails.send({
//         from: 'Acme <onboarding@resend.dev>',
//         to: ['delivered@resend.dev'],
//         subject: 'Hello World',
//         html: '<strong>It works!</strong>',
//     });

//     if (error) {
//         return console.error({ error });
//     }

//     console.log({ data });
// }

// export default resendMailService;

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
            throw new ServiceError("ResendMailSendService is facing issue", error);
        }

        return { status: "SUCCESS", id: data?.id };
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error;
        }

        if (error instanceof Error) {
            throw error;
        }
        throw new ServiceUnavailableError("Resend-Mail-Send-Service is unavailable", error);
    }
}