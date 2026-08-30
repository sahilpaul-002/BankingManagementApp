import mongoose, { Schema } from "mongoose";
import type { userCardTransactionsTypes } from "../types/schemaTypes.js";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const userCardTransactionsSchema = new Schema<userCardTransactionsTypes>(
    {
        cardholder_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        card_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        transaction_id: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
        },

        transaction_type: {
            type: String,
            required: true,
            enum: ["PURCHASE", "REFUND", "WITHDRAWAL", "REVERSAL", "FEE"],
        },

        transaction_status: {
            type: String,
            required: true,
            default: "PENDING",
            enum: ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
        },

        authorization_type: {
            type: String,
            required: true,
            enum: ["HOLD", "IMMEDIATE"],
        },

        authorization_status: {
            type: String,
            required: true,
            default: "PENDING",
            enum: ["PENDING", "AUTHORIZED", "REJECTED", "EXPIRED"],
        },

        authorization_expires_at: {
            type: Date,
            required: true,
        },

        authorized_at: {
            type: Date,
            default: null,
        },

        authorized_by: {
            type: String,
            default: null,
            trim: true,
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
            type: Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        fee: {
            type: Schema.Types.Decimal128,
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
    cardholder_id: 1,
    card_id: 1,
    transaction_id: -1,
});

userCardTransactionsSchema.index({
    transaction_status: 1,
    createdAt: -1,
});

userCardTransactionsSchema.index({
    authorization_status: 1,
    authorization_expires_at: 1,
});

userCardTransactionsSchema.index({
    transaction_id: 1,
    reference_id: 1,
});

const userCardTransactionsModel = mongoose.model<userCardTransactionsTypes>(
    "CardTransactions",
    userCardTransactionsSchema,
    "user_card_transactions"
);

export { userCardTransactionsModel };