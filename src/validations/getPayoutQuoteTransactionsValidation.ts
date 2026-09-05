import z from "zod";

const getPayoutQuoteTransactionsValidationSchema = z.object({
    user_id: z
        .string()
        .trim()
        .min(1, "User id is required"),

    beneficiary_id: z
        .string()
        .trim()
        .min(1, "Beneficiary id cannot be empty")
        .optional(),

    source_currency: z
        .enum(
            ["USD", "EUR", "SGD"],
            {
                error: "Invalid source currency - source currency must be ['USD', 'EUR', 'SGD']",
            }
        )
        .optional(),

    destination_currency: z
        .enum(
            ["USD", "EUR", "SGD"],
            {
                error: "Invalid destination currency - destination currency must be ['USD', 'EUR', 'SGD']",
            }
        )
        .optional(),

    status: z
        .enum(
            [
                "PENDING",
                "PROCESSING",
                "SUCCESS",
                "FAILED",
                "CANCELLED",
            ],
            {
                error: "Invalid status - status must be ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED']",
            }
        )
        .optional(),

    from_date: z
        .iso
        .date({
            error: "Date must be in YYYY-MM-DD format (e.g. 2026-07-03)",
        })
        .optional(),

    to_date: z
        .iso
        .date({
            error: "Date must be in YYYY-MM-DD format (e.g. 2026-07-03)",
        })
        .optional(),

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
        // Validate Date Range
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

export default getPayoutQuoteTransactionsValidationSchema;