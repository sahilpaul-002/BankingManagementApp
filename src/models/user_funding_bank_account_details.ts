import mongoose, { Schema } from "mongoose";
import type { userFundingBankAccountDetailsSchemaTypes } from "../types/schemaTypes.js";

const userFundingBankAccountDetailsSchema = new Schema<userFundingBankAccountDetailsSchemaTypes>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "UserDetails",
            required: true,
            unique: true,
            index: true
        },

        cardholder_id: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true
        },

        account_holder_name: {
            type: String,
            required: true
        },

        account_number: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        account_currency: {
            type: String,
            required: true,
            enum: ["USD"],
            default: "USD"
        },

        account_balance: {
            type: Schema.Types.Decimal128,
            required: true,
            default: 0
        },

        swift_code: {
            type: String,
            required: true
        },

        iban_code: {
            type: String,
            required: true
        },

        bank_name: {
            type: String,
            required: true
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

const userFundingBankAccountDetailsModel = mongoose.model("UserFundingBankAccountDetails", userFundingBankAccountDetailsSchema, "user_funding_bank_account_details");

export { userFundingBankAccountDetailsModel };