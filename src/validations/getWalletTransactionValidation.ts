import z from "zod";

const getWalletTransactionsValidationSchema = z.object({
    wallet_id: z.string().trim().min(1, "Wallet_Id is required"),

    wallet_type: z.enum(
        ["FIAT", "CRYPTO"],
        {
            error: "Wallet type must be either FIAT or CRYPTO",
        }
    ).optional(),

    wallet_currency: z.enum(
        ["USD", "EUR", "SGD", "USDC", "USDT"],
        {
            error: "Invalid wallet currency -wallet currency must be ['USD', 'EUR', 'SGD', 'USDC', 'USDT']",
        }
    ).optional(),

    transaction_type: z.enum(
        ["LOAD", "WITHDRAW", "TRANSFER", "HOLD", "RELEASE", "REFUND"],
        {
            error: "Invalid transaction type - transaction type must be ['LOAD', 'WITHDRAW', 'TRANSFER', 'HOLD', 'RELEASE', 'REFUND']",
        }
    ).optional(),

    transaction_status: z.enum(
        ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
        {
            error: "Invalid transaction status - transaction status must be ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED']",
        }
    ).optional(),

    from_date: z.iso.date({
        error: "Date must be in YYYY-MM-DD format (e.g. 2026-07-03)",
    }).optional(),

    to_date: z.iso.date({
        error: "Date must be in YYYY-MM-DD format (e.g. 2026-07-03)",
    }).optional(),
})
    .superRefine((data, ctx) => {
        if (!data.wallet_type || !data.wallet_currency) {
            return;
        }

        // CRYPTO wallets can only use USDT or USDC
        if (
            data.wallet_type === "CRYPTO" &&
            !["USDT", "USDC"].includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["wallet_currency"],
                message:
                    "For CRYPTO wallets, wallet currency must be USDT or USDC",
            });
        }

        // FIAT wallets can only use USD, EUR or SGD
        if (
            data.wallet_type === "FIAT" &&
            !["USD", "EUR", "SGD"].includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["wallet_currency"],
                message:
                    "For FIAT wallets, wallet currency must be USD, EUR or SGD",
            });
        }
    });

export default getWalletTransactionsValidationSchema;