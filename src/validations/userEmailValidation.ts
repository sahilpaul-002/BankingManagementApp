import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
const ENVIRONMENT: string = process.env.NODE_ENV || "PRODUCTION";

const disposableDomains = [
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "guerrillamail.com",
    "dispostable.com",
    "trashmail.com",
    "fakeinbox.com",
    "getnada.com",
    "temp-mail.org",
    "maildrop.cc",
    "mytemp.email",
    "disposablemail.com",
    "trashmail.net",
    "tempmail.net",
    "throwawaymail.com"
];

const userEmailValidationSchema = z
    .string()
    .trim()
    .email("Invalid email format")
    .max(100, "Email too long")
    .refine((email) => {

        // Allow disposable emails outside production
        if (ENVIRONMENT?.toUpperCase() !== "PRODUCTION") {
            return true;
        }

        const domain = email.split("@")[1]?.toLowerCase();

        return domain
            ? !disposableDomains.includes(domain)
            : false;

    }, {
        message: "Disposable email addresses are not allowed"
    });

export default userEmailValidationSchema;