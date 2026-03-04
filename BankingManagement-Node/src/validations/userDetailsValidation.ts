import { z } from "zod";
import calculateAge from "../utils/calculateAge.js";
import ValidateMobileNumber from "../utils/validatePhoneNumber.js";
import type { CountryCode } from "libphonenumber-js";

export const userDetailsValidationSchema = z.object({

    full_name: z
        .string("Full name is required and must be a string")
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name cannot exceed 100 characters")
        .regex(/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, dots (.), apostrophes ('), and hyphens (-)."),

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

    mobile_country_code: z
        .string("Mobile country code is required and must be a string")
        .trim()
        .regex(/^\+\d{1,4}$/, "Invalid mobile country code (Example: +91)"),

    mobile_country_name: z
        .string("Mobile country name is required and must be a string")
        .trim()
        .min(2, "Mobile country name must be at least 2 characters")
        .max(2, "Mobile country name cannot exceed 2 characters")
        .regex(/^[A-Z]{2}$/, "Country code must be exactly 2 uppercase letters (Example: IN, US)"),

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

    // gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    gender: z
        .enum(["MALE", "FEMALE", "OTHER"], "Gender must be one of MALE | FEMAlLE | OTHER")
})
    .strict() // 🚨 VERY IMPORTANT → Disallow extra fields
    .superRefine((data, ctx) => {
        const result = ValidateMobileNumber(
            data.phone_number,
            data.mobile_country_name as CountryCode
        );

        if (!result.isValid) {
            ctx.addIssue({
                path: ["phone_number"],
                code: "custom",
                message: result.message || "Invalid phone number"
            });
        }
    });

export default userDetailsValidationSchema;