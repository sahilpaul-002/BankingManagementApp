import mongoose, { Schema } from "mongoose";
import type { userWalletDetailsSchemaTypes } from "../types/schemaTypes.js";

const userWalletDetailsSchema = new Schema<userWalletDetailsSchemaTypes>(
    {
        user_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        cardholder_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        wallet_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        wallets_details: [
            {
                wallet_status: {
                    type: String,
                    enum: ["ACTIVE", "INACTIVE"],
                    default: "ACTIVE",
                },

                account_balance: {
                    type: mongoose.Schema.Types.Decimal128,
                    default: 0,
                    min: 0,
                },

                holding_amount: {
                    type: mongoose.Schema.Types.Decimal128,
                    default: 0,
                    min: 0,
                },

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

                daily_transaction: {
                    credit: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    debit: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                },

                monthly_transaction: {
                    credit: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    debit: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    month: {
                        type: Number,
                        default: () => new Date().getMonth() + 1,
                    },
                    year: {
                        type: Number,
                        default: () => new Date().getFullYear(),
                    },
                },

                yearly_transaction: {
                    credit: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    debit: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    year: {
                        type: Number,
                        default: () => new Date().getFullYear(),
                    },
                },
            }
        ],
    },
    { timestamps: true }
);

userWalletDetailsSchema.index({
    cardholder_id: 1,
    wallet_id: 1,
});

const userWalletDetailsModel = mongoose.model<userWalletDetailsSchemaTypes>(
    "WalletDetails",
    userWalletDetailsSchema,
    "user_wallet_details"
);

export { userWalletDetailsModel };