import mongoose, { Schema } from "mongoose";
import type { userWalletDetailsSchemaTypes } from "../types/schemaTypes.js";

const userWalletDetailsSchema = new Schema<userWalletDetailsSchemaTypes>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "UserDetails",
            required: true,
            unique: true,
            index: true,
        },

        cardholder_id: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
        },

        wallets_details: [
            {
                wallet_status: {
                    type: String,
                    enum: ["ACTIVE", "INACTIVE"],
                    default: "ACTIVE",
                },

                account_balance: {
                    type: Schema.Types.Decimal128,
                    default: () => mongoose.Types.Decimal128.fromString("0"),
                    min: 0,
                },

                available_balance: {
                    type: Schema.Types.Decimal128,
                    default: () => mongoose.Types.Decimal128.fromString("0"),
                    min: 0,
                },

                holding_amount: {
                    type: Schema.Types.Decimal128,
                    default: () => mongoose.Types.Decimal128.fromString("0"),
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
                        type: Schema.Types.Decimal128,
                        default: () => mongoose.Types.Decimal128.fromString("0"),
                        min: 0,
                        required: true,
                    },
                    debit: {
                        type: Schema.Types.Decimal128,
                        default: () => mongoose.Types.Decimal128.fromString("0"),
                        min: 0,
                        required: true,
                    },
                    date: {
                        type: Date,
                        default: Date.now,
                        required: true,
                    },
                },

                monthly_transaction: {
                    credit: {
                        type: Schema.Types.Decimal128,
                        default: () => mongoose.Types.Decimal128.fromString("0"),
                        min: 0,
                        required: true,
                    },
                    debit: {
                        type: Schema.Types.Decimal128,
                        default: () => mongoose.Types.Decimal128.fromString("0"),
                        min: 0,
                        required: true,
                    },
                    month: {
                        type: Number,
                        default: () => new Date().getMonth() + 1,
                        required: true,
                    },
                    year: {
                        type: Number,
                        default: () => new Date().getFullYear(),
                        required: true,
                    },
                },

                yearly_transaction: {
                    credit: {
                        type: Schema.Types.Decimal128,
                        default: () => mongoose.Types.Decimal128.fromString("0"),
                        required: true,
                    },
                    debit: {
                        type: Schema.Types.Decimal128,
                        default: () => mongoose.Types.Decimal128.fromString("0"),
                        required: true,
                    },
                    year: {
                        type: Number,
                        default: () => new Date().getFullYear(),
                        required: true,
                    },
                },
            }
        ],
    },
    { timestamps: true }
);

userWalletDetailsSchema.index({
    cardholder_id: 1,
    _id: 1,
});

userWalletDetailsSchema.index({
    _id: 1,
    cardholder_id: 1,
    userId_id: 1
});

const userWalletDetailsModel = mongoose.model<userWalletDetailsSchemaTypes>(
    "WalletDetails",
    userWalletDetailsSchema,
    "user_wallet_details"
);

export { userWalletDetailsModel };