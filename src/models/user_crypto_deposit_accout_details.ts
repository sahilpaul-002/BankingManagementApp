import mongoose, { Schema } from "mongoose";
import type { userCryptoDepositAccountDetailsSchemaTypes } from "../types/schemaTypes.js";

const userCryptoDepositAccountDetailsSchema = new Schema<userCryptoDepositAccountDetailsSchemaTypes>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "UserDetails",
            required: true,
            index: true
        },

        cardholder_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true
        },

        network: {
            type: String,
            required: true,
            enum: [
                "ETHEREUM",
                "POLYGON",
            ]
        },

        asset: {
            type: String,
            required: true,
            enum: [
                "USDT",
                "USDC"
            ]
        },

        deposit_address: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        account_balance: {
            type: Schema.Types.Decimal128,
            required: true,
            default: () => mongoose.Types.Decimal128.fromString("0"),
        },

        is_active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// One deposit address per user per network per asset
userCryptoDepositAccountDetailsSchema.index(
    {
        user_id: 1,
        network: 1,
        asset: 1
    },
    {
        unique: true
    }
);


const userCryptoDepositAccountDetailsModel = mongoose.model("UserCryptoDepositAccountDetails", userCryptoDepositAccountDetailsSchema, "user_crypto_deposit_account_details");

export {userCryptoDepositAccountDetailsModel};