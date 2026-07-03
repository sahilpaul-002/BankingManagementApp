import mongoose, { Schema } from "mongoose";
import type { userWalletTransactionsTypes } from "../types/schemaTypes.js";

const userWalletTransactionSchema = new Schema<userWalletTransactionsTypes>(
    {
        wallet_id: {
            type: String,
            required: true,
            index: true,
        },

        transaction_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        transaction_type: {
            type: String,
            required: true,
            enum: ["LOAD", "WITHDRAW", "TRANSFER", "HOLD", "RELEASE", "REFUND"],
        },

        transaction_status: {
            type: String,
            required: true,
            default: "SUCCESS",
            enum: ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
        },

        wallet_details: {
            wallet_type: {
                type: String,
                required: true,
                enum: ["FIAT", "CRYPTO"],
            },

            wallet_currency: {
                type: String,
                required: true,
                enum: ["USD", "EUR", "SGD", "USDC", "USDT"],
            },
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        balance_before: {
            type: Number,
            required: true,
            min: 0,
        },

        balance_after: {
            type: Number,
            required: true,
            min: 0,
        },

        reference_id: {
            type: String,
            trim: true,
            required: true,
            default: null,
        },

        remarks: {
            type: String,
            trim: true,
            required: true,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

userWalletTransactionSchema.index({
    wallet_id: 1,
    "wallet_details.wallet_type": 1,
    "wallet_details.wallet_currency": 1,
    transaction_type: 1,
    createdAt: -1,
});

const userWalletTransactionsModel =
    mongoose.model<userWalletTransactionsTypes>(
        "WalletTransactions",
        userWalletTransactionSchema,
        "user_wallet_transactions"
    );

export { userWalletTransactionsModel };