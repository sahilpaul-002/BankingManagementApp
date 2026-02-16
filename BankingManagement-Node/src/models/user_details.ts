import mongoose, { Schema, Types } from "mongoose";
import { userBankDetailsModel as user_bank_details } from "./user_bank_details.js";
import { userAddressModel as user_addresses } from "./user_addresses.js";
import type { userDetailsSchema } from "../types/schemaTypes.js";

const userDetailsSchema = new Schema({
    full_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
        unique: true
    },
    mobile_country_code: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true,
        index: true
    },
    date_of_birth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER"],
        required: true
    },
    kyc_status: {
        type: String,
        enum: ["PENDING", "VERIFIED", "REJECTED"],
        default: "PENDING",
        required: true
    },
    risk_category: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
        default: "LOW"
    },
    wallet_id: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["ACTIVE", "DISABLED", "BLOCKED"],
        default: "DISABLED"
    },
    is_active: {
        type: Boolean,
        default: false
    },
    is_email_verified: {
        type: Boolean,
        default: false
    },
    is_phone_verified: {
        type: Boolean,
        default: false
    },
    is_2fa_enabled: {
        type: String,
        enum: ["AUTHENTICATOR", "EMAIL", "SMS", "DISABLED"],
        default: null
    },
    last_login_at: {
        type: Date
    }
}, { timestamps: true, minimize: false }
);

const userDetailsModel = mongoose.model<userDetailsSchema>("UserDetails", userDetailsSchema, "user_details");

export {userDetailsModel};