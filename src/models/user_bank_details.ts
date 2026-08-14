import mongoose, { Schema, Types } from "mongoose";
import type { userBankDetailsSchemaTypes } from "../types/schemaTypes.js";

const userBankDetailsSchema = new Schema<userBankDetailsSchemaTypes>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "UserDetails",
        unique: true,
        required: true,
        index: true
    },
    cardholder_id: {
        type: Schema.Types.ObjectId,
        unique: true,
        index: true,
        default: null
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
    is_verified: {
        type: Boolean,
        default: false
    },
    user_bank_request_id: {
        type: String,
        required: true,
    }
}, { timestamps: true }
);

const userBankDetailsModel = mongoose.model("UserBankDetails", userBankDetailsSchema, "user_bank_details");

export { userBankDetailsModel };