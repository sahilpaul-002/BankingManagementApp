import mongoose, { Schema } from "mongoose";
import type { userCardDetailsSchemaTypes } from "../types/schemaTypes.js";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const userCardDetailsSchema = new Schema<userCardDetailsSchemaTypes>(
    {
        cardholder_id: {
            type: String,
            required: true,
            index: true,
        },

        card_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        card_number: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        card_status: {
            type: String,
            required: true,
            enum: ["ACTIVE", "INACTIVE", "FROZEN", "BLOCKED"],
            default: "INACTIVE",
        },

        cvv: {
            type: String,
            required: true,
            default: "000",
            minlength: 3,
            maxlength: 3,
            trim: true,
        },

        issued_date: {
            type: Date,
            required: true,
            default: Date.now,
        },

        valid_date: {
            type: Date,
            required: true,
            default: Date.now,
        },

        name_on_card: {
            type: String,
            required: true
        },

        card_type: {
            type: String,
            enum: ["VIRTUAL", "PHYSICAL"],
            required: true,
        },

        card_currency: {
            type: String,
            enum: ["USD", "EUR", "SGD"],
            required: true,
        },

        card_limits: {
            daily_limit: {
                type: String,
                default: "1000",
                required: true,
            },

            monthly_limit: {
                type: String,
                default: "2000",
                required: true,
            },

            yearly_limit: {
                type: String,
                default: "5000",
                required: true,
            },
        },

        valid_merchant_categories: {
            type: [{
                type: String,
                enum: MERCHANT_CATEGORIES,
            }],
            required: true,
        },

        daily_transaction: {
            type: Number,
            required: true,
            defaullt: 0
        },

        monthly_transaction: {
            type: Number,
            required: true,
            defaullt: 0
        },

        yearly_transaction: {
            type: Number,
            required: true,
            defaullt: 0
        }
    },
    { timestamps: true }
);

const userCardDetailsModel = mongoose.model<userCardDetailsSchemaTypes>(
    "CardDetails",
    userCardDetailsSchema,
    "user_card_details"
);

export { userCardDetailsModel };