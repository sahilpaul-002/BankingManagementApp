import { z } from "zod";

// ADDRESS SCHEMA
const addressSchema = z.object({

    line1: z
        .string("Address line1 is required and must be a string")
        .trim()
        .min(3, "Address line1 must be at least 3 characters")
        .max(200, "Address line1 cannot exceed 200 characters"),

    line2: z
        .string("Address line2 must be a string")
        .trim()
        .max(200, "Address line2 cannot exceed 200 characters")
        .nullable()
        .optional(),

    city: z
        .string("City is required and must be a string")
        .trim()
        .min(2, "City must be at least 2 characters")
        .max(100, "City cannot exceed 100 characters")
        .regex(/^[A-Za-z\s.-]+$/, "City can contain only alphabets, spaces, dots and hyphens"),

    state: z
        .string("State is required and must be a string")
        .trim()
        .min(2, "State must be at least 2 characters")
        .max(100, "State cannot exceed 100 characters")
        .regex(/^[A-Za-z\s.-]+$/, "State can contain only alphabets, spaces, dots and hyphens"),

    postal_code: z
        .string("Postal code is required and must be a string")
        .trim()
        .regex(/^[A-Za-z0-9\- ]{3,12}$/, "Invalid postal code format"),

    country: z
        .string("Country is required and must be a string")
        .trim()
        .min(2, "Country must be at least 2 characters")
        .max(100, "Country cannot exceed 100 characters")
        .regex(/^[A-Za-z\s.-]+$/, "Country can contain only alphabets, spaces, dots and hyphens"),

    type: z
        .enum(["Billing", "Delivery"], "Address type must be Billing or Delivery")

}).strict();


// USER ADDRESS DETAILS VALIDATION SCHEMA
export const userAddressDetailsValidationSchema = z.object({

    email: z
        .email("Invalid email format")
        .trim()
        .min(1, "Email is required")
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

    billing_address: addressSchema
        .refine((data) => data.type === "Billing", {
            message: "Billing address type must be 'Billing'",
            path: ["type"]
        }),

    delivery_address: addressSchema
        .refine((data) => data.type === "Delivery", {
            message: "Delivery address type must be 'Delivery'",
            path: ["type"]
        })

}).strict();



// USER BANK DETAILS VALIDATION SCHEMA
export const userBankDetailsValidationSchema = z.object({

    email: z
        .email("Invalid email format")
        .trim()
        .min(1, "Email is required")
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

    account_holder_name: z
        .string("Account holder name is required and must be a string")
        .trim()
        .min(3, "Account holder name must be at least 3 characters")
        .max(100, "Account holder name cannot exceed 100 characters")
        .regex(
            /^[a-zA-Z\s.'-]+$/,
            "Account holder name can only contain alphabets, spaces, dots (.), apostrophes ('), and hyphens (-)"
        ),

    account_number: z
        .string("Account number is required and must be a string")
        .trim()
        .regex(/^\d{8,20}$/, "Account number must be between 8 to 20 digits"),

    swift_code: z
        .string("SWIFT code is required and must be a string")
        .trim()
        .regex(
            /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
            "Invalid SWIFT/BIC code. It must be 8 or 11 uppercase alphanumeric characters."
        ),

    iban_code: z
        .string("IBAN code is required and must be a string")
        .trim()
        .regex(
            /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/,
            "Invalid IBAN format."
        ),

    bank_name: z
        .string("Bank name is required and must be a string")
        .trim()
        .min(2, "Bank name must be at least 2 characters")
        .max(100, "Bank name cannot exceed 100 characters"),

    is_verified: z
        .boolean("IsVerified must be a boolean")
        .optional(),

    // user_bank_request_id: z
    //     .string("User bank request id is required and must be a string")
    //     .trim()
    //     .min(1, "User bank request id is required")
    //     .max(50, "Bank name cannot exceed 100 characters"),

}).strict();




// COMBINED VALIDATION SCHEMA
export const userOnboardingDetailsValidationSchema = z.object({

    address_details: userAddressDetailsValidationSchema,

    bank_details: userBankDetailsValidationSchema

})
    .strict()
    .superRefine((data, ctx) => {

        // Ensure same user_id in both schemas
        if (
            data.address_details.email !==
            data.bank_details.email
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["bank_details", "user_id"],
                message:
                    "Bank details user_id must match address details user_id"
            });
        }

    });