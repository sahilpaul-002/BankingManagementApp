import mongoose, { Schema, Types } from "mongoose";
import type { userBankDetailsSchema } from "../types/schemaTypes.js";

const userBankDetailsSchema = new Schema<userBankDetailsSchema>({
    user_id: {
        type: Types.ObjectId,
        ref: "user_details",
        required: true,
        index: true
    },
    account_holder_name: {
        type: String,
        required: true
    },
    account_number: {
        type: String,
        required: true,
        unique: true
    },
    ifsc_code: {
        type: String,
        required: true,
        index: true
    },
    bank_name: {
        type: String,
        required: true
    },
    branch_name: {
        type: String,
        default: null
    },
    account_type: {
        type: String,
        enum: ["SAVINGS", "CURRENT"],
        default: "SAVINGS"
    },
    is_verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }
);

const userBankDetailsModel = mongoose.model( "UserBankDetails", userBankDetailsSchema, "user_bank_details" );

export { userBankDetailsModel};