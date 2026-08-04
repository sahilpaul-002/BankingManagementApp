import { z } from "zod";

const addBeneficiaryBankDetailsValidationSchema = z.object({

    account_number: z
        .string("Account number is required and must be a string")
        .trim()
        .regex(
            /^\d{8,20}$/,
            "Account number must be between 8 and 20 digits"
        ),

    account_holder_name: z
        .string("Account holder name is required and must be a string")
        .trim()
        .min(3, "Account holder name must be at least 3 characters")
        .max(100, "Account holder name cannot exceed 100 characters")
        .regex(
            /^[A-Za-z\s.'-]+$/,
            "Account holder name can only contain alphabets, spaces, dots (.), apostrophes ('), and hyphens (-)"
        ),

    swift_code: z
        .string("SWIFT code is required and must be a string")
        .trim()
        .regex(
            /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
            "Invalid SWIFT/BIC code. It must be 8 or 11 uppercase alphanumeric characters."
        )
        .transform((value) => value.toUpperCase()),

    iban_code: z
        .string("IBAN code is required and must be a string")
        .trim()
        .regex(
            /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/,
            "Invalid IBAN format."
        )
        .transform((value) => value.toUpperCase().replace(/\s+/g, "")),

    bank_name: z
        .string("Bank name is required and must be a string")
        .trim()
        .min(2, "Bank name must be at least 2 characters")
        .max(100, "Bank name cannot exceed 100 characters")
        .regex(
            /^[A-Za-z0-9\s.'&()-]+$/,
            "Bank name contains invalid characters"
        ),

    is_verified: z
        .boolean("is_verified must be a boolean")
        .optional()

}).strict();

export default addBeneficiaryBankDetailsValidationSchema