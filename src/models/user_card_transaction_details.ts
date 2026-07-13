import mongoose, { Schema } from "mongoose";
import type { userCardTransactionsTypes } from "../types/schemaTypes.js";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const userCardTransactionsSchema = new Schema<userCardTransactionsTypes>(
    {
        cardholder_id: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },

        card_id: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },

        transaction_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        transaction_type: {
            type: String,
            required: true,
            enum: ["PURCHASE", "REFUND", "WITHDRAWAL", "REVERSAL", "FEE"],
        },

        transaction_status: {
            type: String,
            required: true,
            default: "SUCCESS",
            enum: ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
        },

        card_number: {
            type: String,
            required: true,
            trim: true,
        },

        currency: {
            type: String,
            required: true,
            enum: ["USD"], // or ["USD", "EUR", "SGD"] if supported
        },

        name_on_card: {
            type: String,
            required: true,
            trim: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        card_type: {
            type: String,
            required: true,
            enum: ["VIRTUAL", "PHYSICAL"],
        },

        merchant_name: {
            type: String,
            required: true,
            trim: true,
        },

        merchant_category: {
            type: String,
            required: true,
            enum: MERCHANT_CATEGORIES,
        },

        merchant_country: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        reference_id: {
            type: String,
            default: null,
            trim: true,
        },

        remarks: {
            type: String,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

userCardTransactionsSchema.index({
    cardholder_id: 1,
    card_id: 1,
    createdAt: -1,
});

userCardTransactionsSchema.index({
    transaction_id: 1,
});

userCardTransactionsSchema.index({
    transaction_status: 1,
    createdAt: -1,
});

const userCardTransactionsModel = mongoose.model<userCardTransactionsTypes>(
    "CardTransactions",
    userCardTransactionsSchema,
    "user_card_transactions"
);

export { userCardTransactionsModel };