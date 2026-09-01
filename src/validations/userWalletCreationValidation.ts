import {Decimal} from "decimal.js";
import z from "zod";

const userWalletCreationValidationSchema = z.object({
    wallet_status: z
        .enum(["ACTIVE", "INACTIVE"])
        .optional(),

    account_balance: z
        .number("Account balance must be a number")
        .min(0, "Account balance cannot be negative")
        .transform((value) => new Decimal(value))
        .optional()
        .default(new Decimal(0)),

    holding_amount: z
        .number("Holding amount must be a number")
        .min(0, "Holding amount cannot be negative")
        .transform((value) => new Decimal(value))
        .optional()
        .default(new Decimal(0)),

    wallet_type: z
        .enum(["FIAT", "CRYPTO"], {
            error: "Wallet type must be either FIAT or CRYPTO"
        }),

    wallet_currency: z
        .enum(["USD", "EUR", "SGD", "USDC", "USDT"], {
            error: "Invalid wallet currency"
        })
})
    .superRefine((data, ctx) => {
        // Optional business rule:
        // FIAT → USD/EUR/SGD
        // CRYPTO → USDC/USDT

        const fiatCurrencies = ["USD", "EUR", "SGD"];
        const cryptoCurrencies = ["USDC", "USDT"];

        if (
            data.wallet_type === "FIAT" &&
            !fiatCurrencies.includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["wallet_currency"],
                message:
                    "FIAT wallet supports only USD, EUR, SGD"
            });
        }

        if (
            data.wallet_type === "CRYPTO" &&
            !cryptoCurrencies.includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["wallet_currency"],
                message:
                    "CRYPTO wallet supports only USDC, USDT"
            });
        }
    });

export default userWalletCreationValidationSchema;