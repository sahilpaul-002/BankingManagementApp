import mongoose, { Schema } from "mongoose";
import type { userWalletDetailsSchemaTypes } from "../types/schemaTypes.js";

const userWalletDetailsSchema = new Schema<userWalletDetailsSchemaTypes>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "user_details",
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

        wallet_status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },

        account_balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        holding_amount: {
            type: Number,
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
    },
    { timestamps: true }
);

const userWalletDetailsModel = mongoose.model<userWalletDetailsSchemaTypes>(
    "WalletDetails",
    userWalletDetailsSchema,
    "user_wallet_details"
);

export { userWalletDetailsModel };