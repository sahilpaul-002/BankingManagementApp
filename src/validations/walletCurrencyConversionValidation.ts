import z from "zod";
import { Decimal } from "decimal.js";

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
        .instanceof(Decimal)
        .refine(
            (value) => value.isFinite() && value.gt(0),
            {
                message: "Amount must be greater than 0",
            }
        ),

}).superRefine((data, ctx) => {
    if (data.source_wallet_currency === data.destination_wallet_currency) {
        ctx.addIssue({
            code: "custom",
            path: ["destination_wallet_currency"],
            message: "Source and destination currencies must be different",
        });

        return;
    }

    const source = data.source_wallet_currency;
    const destination = data.destination_wallet_currency;

    const fiatCurrencies = ["USD", "EUR", "SGD"];
    const cryptoCurrencies = ["USDC", "USDT"];

    const isSourceFiat = fiatCurrencies.includes(source);
    const isDestinationFiat = fiatCurrencies.includes(destination);

    const isSourceCrypto = cryptoCurrencies.includes(source);
    const isDestinationCrypto = cryptoCurrencies.includes(destination);

    // Fiat → Fiat
    if (isSourceFiat && isDestinationFiat) {
        return;
    }

    // USD → Crypto
    if (source === "USD" && isDestinationCrypto) {
        return;
    }

    // Crypto → USD
    if (isSourceCrypto && destination === "USD") {
        return;
    }

    ctx.addIssue({
        code: "custom",
        path: ["destination_wallet_currency"],
        message: "Supported conversions are fiat-to-fiat and USD-to-USDT/USDC or USDT/USDC-to-USD",
    });
});

export default walletCurrencyConversionValidationSchema;