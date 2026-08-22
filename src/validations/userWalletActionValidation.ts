import z from "zod";

// ---------------------------------------------------------
// COMMON WALLET ACTION SCHEMA
// ---------------------------------------------------------

const userWalletActionBaseSchema = z.object({
    wallet_type: z.enum(["FIAT", "CRYPTO"], {
        error: "Wallet type must be either FIAT or CRYPTO"
    }),

    wallet_currency: z.enum(
        ["USD", "EUR", "SGD", "USDC", "USDT"],
        {
            error: "Invalid wallet currency"
        }
    ),

    network: z
        .enum(["ETHEREUM", "POLYGON"], {
            error: "Invalid crypto network"
        })
        .optional(),

    amount: z
        .number({
            error: "Amount must be a number"
        })
        .positive("Amount must be greater than 0")
});


// ---------------------------------------------------------
// LOAD WALLET VALIDATION SCHEMA
// ---------------------------------------------------------

export const loadWalletValidationSchema =
    userWalletActionBaseSchema.superRefine((data, ctx) => {

        const fiatCurrencies = ["USD", "EUR", "SGD"];
        const cryptoCurrencies = ["USDC", "USDT"];

        // -------------------------------------------------
        // FIAT WALLET
        // -------------------------------------------------

        if (
            data.wallet_type === "FIAT" &&
            !fiatCurrencies.includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["wallet_currency"],
                message: "FIAT wallet supports only USD, EUR, SGD"
            });
        }

        // Network should NOT be provided for FIAT wallet
        if (
            data.wallet_type === "FIAT" &&
            data.network !== undefined
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["network"],
                message: "Network is not applicable for FIAT wallet"
            });
        }

        // -------------------------------------------------
        // CRYPTO WALLET
        // -------------------------------------------------

        if (
            data.wallet_type === "CRYPTO" &&
            !cryptoCurrencies.includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["wallet_currency"],
                message: "CRYPTO wallet supports only USDC, USDT"
            });
        }

        // Network is REQUIRED for CRYPTO wallet during LOAD
        if (
            data.wallet_type === "CRYPTO" &&
            data.network === undefined
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["network"],
                message: "Network is required for CRYPTO wallet"
            });
        }
    });


// ---------------------------------------------------------
// WITHDRAW WALLET VALIDATION SCHEMA
// ---------------------------------------------------------

export const withdrawWalletValidationSchema =
    userWalletActionBaseSchema.superRefine((data, ctx) => {

        const fiatCurrencies = ["USD", "EUR", "SGD"];
        const cryptoCurrencies = ["USDC", "USDT"];

        // -------------------------------------------------
        // FIAT WALLET
        // -------------------------------------------------

        if (
            data.wallet_type === "FIAT" &&
            !fiatCurrencies.includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["wallet_currency"],
                message: "FIAT wallet supports only USD, EUR, SGD"
            });
        }

        // Network should NOT be provided for FIAT wallet
        if (
            data.wallet_type === "FIAT" &&
            data.network !== undefined
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["network"],
                message: "Network is not applicable for FIAT wallet"
            });
        }

        // -------------------------------------------------
        // CRYPTO WALLET
        // -------------------------------------------------

        if (
            data.wallet_type === "CRYPTO" &&
            !cryptoCurrencies.includes(data.wallet_currency)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["wallet_currency"],
                message: "CRYPTO wallet supports only USDC, USDT"
            });
        }

        // NOTE:
        // Network is NOT required for withdrawal.
        // The wallet/network can be determined from the existing wallet record.
    });


// ---------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------

export default {
    loadWalletValidationSchema,
    withdrawWalletValidationSchema
};