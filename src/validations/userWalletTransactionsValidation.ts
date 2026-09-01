import z from "zod";
import { Decimal } from "decimal.js";

const userWalletTransactionsValidationSchema = z.object(
    {
        transaction_type: z.enum(
            ["LOAD", "WITHDRAW", "TRANSFER", "HOLD", "RELEASE", "REFUND"],
            {
                error: "Invalid transaction type",
            }
        ),

        transaction_status: z
            .enum(["PENDING", "SUCCESS", "FAILED", "REVERSED"])
            .default("SUCCESS"),

        wallet_details: z.object({
            wallet_type: z.enum(
                ["FIAT", "CRYPTO"],
                {
                    error: "Wallet type must be FIAT or CRYPTO",
                }
            ),

            wallet_currency: z.enum(
                ["USD", "EUR", "SGD", "USDC", "USDT"],
                {
                    error: "Invalid wallet currency",
                }
            ),
        }),

        amount: z.instanceof(Decimal),

        fee: z.instanceof(Decimal),

        balance_before: z.instanceof(Decimal),

        balance_after: z.instanceof(Decimal),

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
    }
).superRefine((data, ctx) => {

    const fiatCurrencies = ["USD", "EUR", "SGD"];
    const cryptoCurrencies = ["USDC", "USDT"];

    if (
        data.wallet_details.wallet_type === "FIAT" &&
        !fiatCurrencies.includes(data.wallet_details.wallet_currency)
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["wallet_details", "wallet_currency"],
            message: "FIAT supports USD, EUR, SGD",
        });
    }

    if (
        data.wallet_details.wallet_type === "CRYPTO" &&
        !cryptoCurrencies.includes(data.wallet_details.wallet_currency)
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["wallet_details", "wallet_currency"],
            message: "CRYPTO supports USDC, USDT",
        });
    }

    const fee = data.fee;
    const amount = data.amount;
    const balanceBefore = data.balance_before;
    const balanceAfter = data.balance_after;

    if (!fee.isFinite() || fee.isNegative()) {
        ctx.addIssue({
            code: "custom",
            path: ["fee"],
            message: "Fee cannot be negative",
        });
    }

    if (!amount.isFinite() || amount.lte(0)) {
        ctx.addIssue({
            code: "custom",
            path: ["amount"],
            message: "Amount must be greater than 0",
        });
    }

    if (!balanceBefore.isFinite() || balanceBefore.isNegative()) {
        ctx.addIssue({
            code: "custom",
            path: ["balance_before"],
            message: "Balance before cannot be negative",
        });
    }

    if (!balanceAfter.isFinite() || balanceAfter.isNegative()) {
        ctx.addIssue({
            code: "custom",
            path: ["balance_after"],
            message: "Balance after cannot be negative",
        });
    }
});

export default userWalletTransactionsValidationSchema;