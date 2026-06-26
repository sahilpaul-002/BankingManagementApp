import z from "zod";

const userWalletLoadValidationSchema = z.object({
    wallet_type: z
        .enum(["FIAT", "CRYPTO"], {
            error: "Wallet type must be either FIAT or CRYPTO"
        }),

    wallet_currency: z
        .enum(["USD", "EUR", "SGD", "USDC", "USDT"], {
            error: "Invalid wallet currency"
        }),

     amount: z
        .number({
            error:
                "Amount must be a number",
        })
        .positive(
            "Amount must be greater than 0"
        ),
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

export default userWalletLoadValidationSchema;