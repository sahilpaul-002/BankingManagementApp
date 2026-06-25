import mongoose, { Schema, Types } from "mongoose";
import { userBankDetailsModel as user_bank_details } from "./user_bank_details.js";
import { userAddressDetailsModel as user_addresses } from "./user_addresses_details.js";
import { type userDetailsSchemaTypes } from "../types/schemaTypes.js";

const userDetailsSchema = new Schema<userDetailsSchemaTypes>({
    full_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    agent_code: {
        type: String,
        required: true,
        trim: true
    },
    subagent_code: {
        type: String,
        required: true,
        trim: true
    },
    program_id: {
        type: String,
        required: true,
        trim: true
    },
    business_id: {
        type: String,
        required: true,
        trim: true
    },
    client_id: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    mobile_country_code: {
        type: String,
        required: true
    },
    mobile_country_name: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true,
        index: true,
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
        enum: ["PENDING", "IN-PROGRESS", "RFI", "COMPLETED"],
        default: "PENDING",
    },
    is_admin: {
        type: String,
        enum: ["Y", "N"],
        default: "N"
    },
    is_master_admin: {
        type: String,
        enum: ["Y", "N"],
        default: "N"
    },
    risk_category: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
        default: "LOW"
    },
    cardholder_id: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["DISABLED", "PRE-VERIFIED", "VERIFIED", "ACTIVE"],
        default: "PRE-VERIFIED"
    },
    is_active: {
        type: String,
        enum: ["Y", "N"],
        default: "N"
    },
    is_email_verified: {
        type: String,
        enum: ["Y", "N"],
        default: "N"
    },
    is_phone_verified: {
        type: String,
        enum: ["Y", "N"],
        default: "N"
    },
    is_2fa_enabled: {
        type: String,
        enum: ["Y", "N"],
        default: "N"
    },
    two_fa_type: {
        type: String,
        enum: ["SMS-OTP", "EMAIL-OTP", "TOTP", null],
        default: null
    },
    authenticator_secret: {
        type: String,
        default: null
    },
    last_login_at: {
        type: Date
    }
}, { timestamps: true, minimize: false }
);

const userDetailsModel = mongoose.model<userDetailsSchemaTypes>("UserDetails", userDetailsSchema, "user_details");

export {userDetailsModel};