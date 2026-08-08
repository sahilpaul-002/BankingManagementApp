import z from "zod";

const SOURCE_WALLET_CURRENCIES = ["USD", "EUR", "SGD"] as const;

const createFiatPayoutQuoteValidationSchema = z.object({
    beneficiary_id: z
        .string("Beneficiary ID is required")
        .trim()
        .min(1, "Beneficiary ID is required"),

    source_wallet_currency: z
        .string("Source wallet currency is required")
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(SOURCE_WALLET_CURRENCIES)
        ),

    source_amount: z
        .coerce
        .number("Source amount must be a number")
        .positive("Source amount must be greater than 0"),
}).strict();

export default createFiatPayoutQuoteValidationSchema;