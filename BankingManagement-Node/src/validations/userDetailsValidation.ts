import { z } from "zod";
import calculateAge from "../utils/calculateAge.js";

export const userDetailsValidationSchema = z.object({

    full_name: z
        .string()
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
                "yopmail.com",
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
        .string()
        .trim()
        .regex(/^\+\d{1,4}$/, "Invalid mobile country code (Example: +91)"),

    mobile_country_name: z
        .string()
        .trim()
        .min(2, "Mobile country name must be at least 2 characters")
        .max(50, "Mobile country name cannot exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Mobile country name can only contain letters and spaces"),

    phone_number: z
        .string()
        .trim()
        .regex(/^\d{4,15}$/, "Phone number must be 4–15 digits"),

    date_of_birth: z
        .string()
        .refine((value) => !isNaN(Date.parse(value)), {
            message: "Invalid date format"
        })
        .transform((value) => new Date(value))
        .refine((dob) => calculateAge(dob) >= 18, {
            message: "User must be at least 18 years old"
        }),

    gender: z.enum(["MALE", "FEMALE", "OTHER"]),

})
    .strict() // 🚨 VERY IMPORTANT → Disallow extra fields
    .superRefine((data, ctx) => {
        // Additional security validations

        // Prevent same phone pattern like 0000000000
        if (/^(\d)\1+$/.test(data.phone_number)) {
            ctx.addIssue({
                path: ["phone_number"],
                code: z.ZodIssueCode.custom,
                message: "Invalid phone number pattern"
            });
        }
    });

export default userDetailsValidationSchema;