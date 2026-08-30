import mongoose from "mongoose";
import z from "zod";
import { Decimal } from "decimal.js";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const userCardTransactionValidationSchema = z.object(
    {
        cardholder_id: z.instanceof(mongoose.Types.ObjectId, {
            message: "Cardholder ID must be a valid ObjectId",
        }),

        card_id: z.instanceof(mongoose.Types.ObjectId, {
            message: "Card ID must be a valid ObjectId",
        }),

        transaction_id: z.instanceof(mongoose.Types.ObjectId, {
            message: "Transaction ID must be a valid ObjectId",
        }),

        transaction_type: z.enum(
            ["PURCHASE", "REFUND", "WITHDRAWAL", "REVERSAL", "FEE"],
            {
                error: "Transaction type must be one of ['PURCHASE', 'REFUND', 'WITHDRAWAL', 'REVERSAL', 'FEE']",
            }
        ),

        transaction_status: z
            .enum(
                ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
                {
                    error: "Transaction status must be one of ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED']",
                }
            )
            .default("SUCCESS"),

        authorization_type: z.enum(
            ["HOLD", "IMMEDIATE"],
            {
                error: "Authorization type must be HOLD or IMMEDIATE",
            }
        ),

        authorization_status: z.enum(
            ["PENDING", "AUTHORIZED", "REJECTED", "EXPIRED"],
            {
                error: "Invalid authorization status",
            }
        ),

        authorization_expires_at: z.date(),

        authorized_at: z.date().nullable(),

        authorized_by: z.string().nullable(),

        card_number: z
            .string()
            .trim()
            .min(1, "Card number is required"),

        currency: z.enum(
            ["USD"],
            {
                error: "Currency must be USD",
            }
        ),

        name_on_card: z
            .string()
            .trim()
            .min(1, "Name on card is required"),

        amount: z.instanceof(mongoose.Types.Decimal128),

        fee: z.instanceof(mongoose.Types.Decimal128),

        card_type: z.enum(
            ["VIRTUAL", "PHYSICAL"],
            {
                error: "Card type must be either VIRTUAL or PHYSICAL",
            }
        ),

        merchant_name: z
            .string()
            .trim()
            .min(1, "Merchant name is required"),

        merchant_category: z.enum(
            MERCHANT_CATEGORIES as [string, ...string[]],
            {
                error: `Merchant category must be one of [${MERCHANT_CATEGORIES.join(", ")}]`,
            }
        ),

        merchant_country: z
            .string()
            .trim()
            .length(
                2,
                "Merchant country must be a valid ISO 3166-1 alpha-2 country code"
            )
            .transform((value) => value.toUpperCase()),

        reference_id: z
            .string()
            .trim()
            .nullable()
            .optional()
            .default(null),

        remarks: z
            .string()
            .trim()
            .nullable()
            .optional()
            .default(null),
    })
    .superRefine((data, ctx) => {
        const amount = new Decimal(data.amount.toString());

        if (!amount.isFinite() || amount.lte(0)) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message: "Amount must be greater than 0",
            });
        }

        const fee = new Decimal(data.fee.toString());
        if (!fee.isFinite() || fee.isNegative()) {
            ctx.addIssue({
                code: "custom",
                path: ["fee"],
                message: "Fee cannot be negative",
            });
        }

        if (
            data.authorization_type === "HOLD" &&
            data.transaction_status !== "PENDING"
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["transaction_status"],
                message: "HOLD transactions must have PENDING status",
            });
        }

        if (
            data.authorization_type === "HOLD" &&
            data.authorization_status !== "PENDING"
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["authorization_status"],
                message: "HOLD transactions must have PENDING authorization status",
            });
        }

        if (
            data.authorization_type === "IMMEDIATE" &&
            data.authorization_status !== "AUTHORIZED"
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["authorization_status"],
                message: "IMMEDIATE transactions must be AUTHORIZED",
            });
        }
    });

export default userCardTransactionValidationSchema;