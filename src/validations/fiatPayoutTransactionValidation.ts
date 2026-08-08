import z from "zod";

const fiatPayoutTransactionValidationSchema = z.object({
    user_id: z
        .string("User ID is required")
        .trim()
        .min(1, "User ID is required"),

    wallet_id: z
        .string("Wallet ID is required")
        .trim()
        .min(1, "Wallet ID is required"),

    beneficiary_id: z
        .string("Beneficiary ID is required")
        .trim()
        .min(1, "Beneficiary ID is required"),

    source_currency: z.enum(
        ["USD", "EUR", "SGD"],
        {
            error: "Invalid source currency",
        }
    ),

    source_amount: z
        .coerce
        .number("Source amount must be a number")
        .positive("Source amount must be greater than 0"),

    destination_currency: z.enum(
        ["USD", "EUR", "SGD"],
        {
            error: "Invalid destination currency",
        }
    ),

    destination_amount: z
        .coerce
        .number("Destination amount must be a number")
        .positive("Destination amount must be greater than 0"),

    exchange_rate: z
        .coerce
        .number("Exchange rate must be a number")
        .positive("Exchange rate must be greater than 0"),

    fee_amount: z
        .coerce
        .number("Fee amount must be a number")
        .min(0, "Fee amount cannot be negative")
        .default(0),

    status: z.enum(
        [
            "PENDING",
            "PROCESSING",
            "SUCCESS",
            "FAILED",
            "CANCELLED",
        ],
        {
            error: "Invalid payout transaction status",
        }
    ).default("PENDING"),

    provider_reference: z
        .string()
        .trim()
        .nullable()
        .optional(),

    remarks: z
        .string()
        .trim()
        .nullable()
        .optional(),
});

export default fiatPayoutTransactionValidationSchema;