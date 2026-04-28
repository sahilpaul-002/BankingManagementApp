import { z } from "zod";
import calculateAge from "../utils/calculateAge.js";
import ValidateMobileNumber from "../utils/validatePhoneNumber.js";
import type { CountryCode } from "libphonenumber-js";

const userDetailsValidationSchema = z.object({

    full_name: z
        .string("Full name is required and must be a string")
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name cannot exceed 100 characters")
        .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, dots (.), apostrophes ('), and hyphens (-)."),

    agent_code: z
        .string("Agent code is required and must be string")
        .trim()
        .min(1, "Subagent code is required")
        .optional(),

    subagent_code: z
        .string("Subagent code is required and must be a string")
        .trim()
        .min(1, "Subagent code is required")
        .optional(),

    program_id: z
        .string("Subagent code is required and must be a string")
        .trim()
        .min(1, "Subagent code is required")
        .optional(),

    business_id: z
        .string("Business-id is required and must be a string")
        .trim()
        .min(1, "Business-id is required")
        .optional(),

    client_id: z
        .string("Client-id, is required and must be a string")
        .trim()
        .min(1, "Client-id is required")
        .optional(),

    email: z
        .email("Invalid email format")
        .trim()
        .max(100, "Email too long")
        .refine((email) => {
            // Prevent disposable email domains
            const disposableDomains = [
                // "example.com",
                "mailinator.com",
                "10minutemail.com",
                "tempmail.com",
                "guerrillamail.com",
                "dispostable.com",
                "trashmail.com",
                // "yopmail.com",
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

            const domain = email.split("@")[1];

            return domain ? !disposableDomains.includes(domain) : false;
        }, {
            message: "Disposable email addresses are not allowed"
        }),

    password: z
        .string("Password is required and must be a string")
        .min(8, "Password must be at least 8 characters")
        .max(50, "Password cannot exceed 50 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=<>])[A-Za-z\d@$!%*?&#^()_+\-=<>]{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")
        .superRefine((password, ctx) => {
            if (!/[A-Z]/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Password must contain at least one uppercase letter (A-Z)"
                });
            }

            if (!/[a-z]/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Password must contain at least one lowercase letter (a-z)"
                });
            }

            if (!/\d/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Password must contain at least one number (0-9)"
                });
            }

            if (!/[@$!%*?&#^()_+\-=<>]/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "Password must contain at least one special character (@ $ ! % * ? & # ^ ( ) _ + - = < >)"
                });
            }

            if (!/^[A-Za-z\d@$!%*?&#^()_+\-=<>]+$/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "Password contains invalid characters. Allowed special characters are: @ $ ! % * ? & # ^ ( ) _ + - = < >"
                });
            }

        }),

    mobile_country_code: z
        .string("Mobile country code is required and must be a string")
        .trim()
        .regex(/^\+\d{1,4}$/, "Invalid mobile country code (Example: +91)"),

    mobile_country_name: z
        .string("Mobile country name is required and must be a string")
        .trim()
        .min(2, "Mobile country name must be at least 2 characters")
        .regex(/^[A-Za-z]+$/, "Mobile country name can contain only alphabets"),

    phone_number: z
        .string("Phone number is required and must be a string")
        .trim()
        .regex(/^\d{4,15}$/, "Phone number must be 4–15 digits"),

    date_of_birth: z
        .string("Date of birth is required and must be a string")
        .refine((value) => !isNaN(Date.parse(value)), {
            message: "Invalid date format"
        })
        .transform((value) => new Date(value))
        .refine((dob) => calculateAge(dob) >= 18, {
            message: "User must be at least 18 years old"
        }),

    gender: z
        .enum(["MALE", "FEMALE", "OTHER"], "Gender must be one of MALE | FEMAlLE | OTHER"),

    kyc_status: z
        .enum(["PENDING", "IN-PROGRESS", "COMPLETED"], "Kyc status must be one of PENDING | IN-PROGRESS | COMPLETED")
        .optional(),
    is_admin: z
        .enum(["Y", "N"], "IsAdmin must be one of Y | N")
        .optional(),
    is_master_admin: z
        .enum(["Y", "N"], "IsMasterAdmin must be one of Y | N")
        .optional(),
    risk_category: z
        .enum(["LOW", "MEDIUM", "HIGH"], "Risk category must be one of LOW | MEDIUM | HIGH")
        .optional(),
    wallet_id: z
        .string("Wallet id must be a string")
        .trim()
        .min(1, "Wallet id must be atleast of 1 character length")
        .nullable()
        .optional(),
    status: z
        .enum(["DISABLED", "PRE-VERIFIED", "VERIFIED", "ACTIVE"], "Status must be one of DISABLED | PRE-VERIFIED | VERIFIED | ACTIVE")
        .optional(),
    is_active: z
        .enum(["Y", "N"], "IsActive must be one of Y | N")
        .optional(),
    is_email_verified: z
        .enum(["Y", "N"], "IsEmailVerified must be one of Y | N")
        .optional(),
    is_phone_verified: z
        .enum(["Y", "N"], "IsPhoneVerified must be one of Y | N")
        .optional(),
    is_2fa_enabled: z
        .enum(["Y", "N"], "Is2FaEnabled must be one of Y | N")
        .optional(),
    two_fa_type: z
        .enum(["SMS-OTP", "EMAIL-OTP", "TOTP"], "Is2FaEnabled must be one of SMS-OTP | EMAIL-OTP | TOTP")
        .nullable()
        .optional(),
    last_login_at: z
        .date()
        .nullable()
        .optional()
})
    .strict() // 🚨 VERY IMPORTANT → Disallow extra fields
    .superRefine((data, ctx) => {
        const result = ValidateMobileNumber(
            data.phone_number,
            data.mobile_country_name as CountryCode
        );

        if (!result.isValid) {
            if (result.message?.includes("Phone number must be  digits")) {
                ctx.addIssue({
                    path: ["phone_number"],
                    code: "custom",
                    message: "Invalid phone number length"
                });
            }
            else {
                ctx.addIssue({
                    path: ["phone_number"],
                    code: "custom",
                    message: result.message || "Invalid phone number"
                });
            }
        }
    });

export default userDetailsValidationSchema;