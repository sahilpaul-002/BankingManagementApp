import mongoose, { Schema, Types } from "mongoose";
import type { UserAddressModelSchema } from "../types/schemaTypes.js";

// BILLING ADDRESS SCHEMA
const billingAddressSchema = new Schema({
    line1: {
        type: String,
        required: true
    },
    line2: {
        type: String,
        default: null
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true
    },
    postal_code: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        default: "Billing"
    }
}, { _id: false });

// DELIVERY ADDRESS SCHEMA
const deliveryAddressSchema = new Schema({
    line1: {
        type: String,
        required: true
    },
    line2: {
        type: String,
        default: null
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true
    },
    postal_code: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        default: "Delivery"
    }
}, { _id: false });

// USER ADDRESS SCHEMA
const userAddressSchema = new Schema<UserAddressModelSchema>({
    user_id: {
        type: Types.ObjectId,
        ref: "user_details",
        required: true,
        index: true
    },

    billing_address: {
        type: billingAddressSchema,
        required: true
    },
    delivery_address: {
        type: deliveryAddressSchema,
        required: true
    }
}, { timestamps: true }
);

const userAddressModel = mongoose.model("UserAddresses", userAddressSchema, "user_addresses");

export { userAddressModel }