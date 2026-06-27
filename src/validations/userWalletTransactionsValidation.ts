import z from "zod";

const userWalletTransactionsValidationSchema = 
    z.object({
        transaction_type: z
            .enum(["LOAD", "WITHDRAW", "TRANSFER", "HOLD", "RELEASE", "REFUND"],
                {error: "Invalid transaction type"}
            ),

        transaction_status: z
            .enum(["PENDING", "SUCCESS", "FAILED", "REVERSED"]
            )
            .default("SUCCESS"),

        wallet_details:
            z.object({
                wallet_type: z
                    .enum(["FIAT", "CRYPTO"],
                        {error: "Wallet type must be FIAT or CRYPTO"}
                    ),

                wallet_currency: z
                    .enum(["USD", "EUR", "SGD", "USDC", "USDT"],
                        {error: "Invalid wallet currency"}
                    ),
            }),

        amount: z
            .number("Amount must be numeric")
            .positive("Amount must be greater than 0"),

        balance_before: z
                .number("Balance before must be numeric")
                .min(0, "Balance before cannot be negative"),

        balance_after: z
                .number("Balance after must be numeric")
                .min(0, "Balance after cannot be negative"),

        reference_id: z
                .string()
                .trim()
                .min(1, "Reference id is required")
                .nullable(),

        remarks: z
                .string()
                .trim()
                .min(1, "Remarks is required.")
                .nullable(),
    })

        .superRefine((data, ctx) => {
                const fiatCurrencies = ["USD", "EUR", "SGD"];

                const cryptoCurrencies = ["USDC", "USDT"];

                // Validate wallet type ↔ currency
                if (data.wallet_details.wallet_type === "FIAT" && !fiatCurrencies.includes(data.wallet_details.wallet_currency)) {
                    ctx.addIssue({
                        code: "custom",

                        path: ["wallet_details", "wallet_currency"],

                        message: "FIAT supports USD, EUR, SGD",
                    });
                }

                if (data.wallet_details.wallet_type === "CRYPTO" && !cryptoCurrencies.includes(data.wallet_details.wallet_currency)) {
                    ctx.addIssue({
                        code: "custom",

                        path: ["wallet_details", "wallet_currency"],

                        message: "CRYPTO supports USDC, USDT",
                    });
                }

                // Balance validation
                if (data.balance_after < 0) {
                    ctx.addIssue({
                        code: "custom",

                        path: ["balance_after"],

                        message: "Final balance cannot be negative",
                    });
                }
            }
        );

export default userWalletTransactionsValidationSchema;