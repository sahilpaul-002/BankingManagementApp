import z from "zod";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const userCardTransactionValidationSchema = z.object({
    cardholder_id: z
        .string()
        .trim()
        .min(1, "Cardholder ID is required"),

    card_id: z
        .string()
        .trim()
        .min(1, "Card ID is required"),

    transaction_id: z
        .string()
        .trim()
        .min(1, "Transaction ID is required"),

    transaction_type: z.enum(
        ["PURCHASE", "REFUND", "WITHDRAWAL", "REVERSAL", "FEE"],
        {
            error: "Transaction type must be one of ['PURCHASE', 'REFUND', 'WITHDRAWAL', 'REVERSAL', 'FEE']",
        }
    ),

    transaction_status: z
        .enum(
            ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
            {
                error: "Transaction status must be one of ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED']",
            }
        )
        .default("SUCCESS"),

    card_number: z
        .string()
        .trim()
        .min(1, "Card number is required"),

    currency: z.enum(
        ["USD"],
        {
            error: "Currency must be USD",
        }
    ),

    name_on_card: z
        .string()
        .trim()
        .min(1, "Name on card is required"),

    amount: z.coerce
        .number({
            error: "Amount must be a valid number",
        })
        .positive("Amount must be greater than 0"),

    card_type: z.enum(
        ["VIRTUAL", "PHYSICAL"],
        {
            error: "Card type must be either VIRTUAL or PHYSICAL",
        }
    ),

    merchant_name: z
        .string()
        .trim()
        .min(1, "Merchant name is required"),

    merchant_category: z.enum(
        MERCHANT_CATEGORIES as [string, ...string[]],
        {
            error: `Merchant category must be one of [${MERCHANT_CATEGORIES.join(", ")}]`,
        }
    ),

    merchant_country: z
        .string()
        .trim()
        .length(2, "Merchant country must be a valid ISO 3166-1 alpha-2 country code")
        .transform((value) => value.toUpperCase()),

    reference_id: z
        .string()
        .trim()
        .nullable()
        .optional()
        .default(null),

    remarks: z
        .string()
        .trim()
        .nullable()
        .optional()
        .default(null),
});

export default userCardTransactionValidationSchema;