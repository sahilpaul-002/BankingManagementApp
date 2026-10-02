import { z } from "zod";
import {Decimal} from "decimal.js";

const walletToWalletLoadValidationSchema = z.object({
    source_user_id: z
        .string({
            message: "Source user ID is required",
        })
        .trim()
        .min(1, "Source user ID is required"),

    source_wallet_id: z
        .string({
            message: "Source wallet ID is required",
        })
        .trim()
        .min(1, "Source wallet ID is required"),

    destination_wallet_id: z
        .string({
            message: "Destination wallet ID is required",
        })
        .trim()
        .min(1, "Destination wallet ID is required"),

    amount: z.instanceof(Decimal, {
        message: "Amount must be a valid decimal value",
    }),

});

export default walletToWalletLoadValidationSchema;