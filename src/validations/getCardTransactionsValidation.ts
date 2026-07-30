import z from "zod";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const getCardTransactionsValidationSchema = z.object({
    card_id: z
        .string()
        .trim()
        .min(1, "Card ID is required"),

    transaction_type: z
        .enum(
            ["PURCHASE", "REFUND", "WITHDRAWAL", "REVERSAL", "FEE"],
            {
                error: "Invalid transaction type - transaction type must be ['PURCHASE', 'REFUND', 'WITHDRAWAL', 'REVERSAL', 'FEE']",
            }
        )
        .optional(),

    transaction_status: z
        .enum(
            ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
            {
                error: "Invalid transaction status - transaction status must be ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED']",
            }
        )
        .optional(),

    card_type: z
        .enum(
            ["VIRTUAL", "PHYSICAL"],
            {
                error: "Card type must be either VIRTUAL or PHYSICAL",
            }
        )
        .optional(),

    currency: z
        .enum(
            ["USD"],
            {
                error: "Currency must be USD",
            }
        )
        .optional(),

    merchant_category: z
        .enum(
            MERCHANT_CATEGORIES as [string, ...string[]],
            {
                error: `Invalid merchant category - merchant category must be one of [${MERCHANT_CATEGORIES.join(", ")}]`,
            }
        )
        .optional(),

    merchant_country: z
        .string()
        .trim()
        .length(2, "Merchant country must be a valid ISO country code")
        .transform((value) => value.toUpperCase())
        .optional(),

    from_date: z.iso.date({
        error: "Date must be in YYYY-MM-DD format (e.g. 2026-07-03)",
    }).optional(),

    to_date: z.iso.date({
        error: "Date must be in YYYY-MM-DD format (e.g. 2026-07-03)",
    }).optional(),

    page: z.coerce
        .number({
            error: "Page must be a number",
        })
        .int("Page must be a positive integer")
        .min(1, "Page must be a positive integer")
        .default(1),

    page_size: z.coerce
        .number({
            error: "Page size must be a number",
        })
        .int("Page size must be an integer")
        .min(1, "Page size must be at least 1")
        .max(50, "Page size must not exceed 50")
        .default(30),
})
    .superRefine((data, ctx) => {

        if (data.from_date && data.to_date) {
            const fromDate = new Date(data.from_date);
            const toDate = new Date(data.to_date);

            if (fromDate > toDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["to_date"],
                    message: "To date must be greater than or equal to from date",
                });
            }
        }
    });

export default getCardTransactionsValidationSchema;