import z from "zod";

const WALLET_CURRENCIES = [
    "USD",
    "EUR",
    "SGD",
    "USDC",
    "USDT",
] as const;

const walletCurrencyConversionValidationSchema = z.object({

    cardholder_id: z
        .string("Cardholder ID is required")
        .trim()
        .min(1, "Cardholder ID is required"),

    source_wallet_currency: z
        .string("Source wallet currency is required")
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(WALLET_CURRENCIES)
        ),

    destination_wallet_currency: z
        .string("Destination wallet currency is required")
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(WALLET_CURRENCIES)
        ),

    amount: z
        .coerce
        .number("Amount is required and must be a number")
        .positive("Amount must be greater than 0")
        .finite("Amount must be a valid number"),

}).superRefine((data, ctx) => {

    if (
        data.source_wallet_currency ===
        data.destination_wallet_currency
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["destination_wallet_currency"],
            message:
                "Source and destination currencies must be different",
        });
    }

});

export default walletCurrencyConversionValidationSchema;