import mongoose, { Schema } from "mongoose";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";
import type { userCardDetailsSchemaTypes } from "../types/schemaTypes.js";
import {Decimal} from "decimal.js"

const decimalField = (defaultValue: string) => ({
    type: Schema.Types.Decimal128,
    required: true,
    default: () => mongoose.Types.Decimal128.fromString(defaultValue),
    validate: {
        validator(value: mongoose.Types.Decimal128) {
            const decimalValue = new Decimal(value.toString());

            return (
                decimalValue.greaterThanOrEqualTo(10) &&
                decimalValue.decimalPlaces() <= 4
            );
        },
        message: "Value must be at least 10 and must have at most 4 decimal places."
    }
});

const userCardDetailsSchema = new Schema<userCardDetailsSchemaTypes>(
    {
        cardholder_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
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
            enum: ["ACTIVE", "INACTIVE", "FROZEN", "BLOCKED"],
            default: "INACTIVE",
            required: true,
        },

        cvv: {
            type: String,
            minlength: 3,
            maxlength: 3,
            default: "000",
            required: true,
        },

        issued_date: {
            type: Date,
            default: Date.now,
            required: true,
        },

        valid_date: {
            type: Date,
            required: true,
        },

        name_on_card: {
            type: String,
            required: true,
            trim: true,
        },

        card_type: {
            type: String,
            enum: ["VIRTUAL", "PHYSICAL"],
            required: true,
        },

        card_currency: {
            type: String,
            enum: ["USD"],
            default: "USD",
            required: true,
            immutable: true, // Optional: prevent changing after creation
        },

        card_limits: {
            daily_limit: decimalField("1000"),
            monthly_limit: decimalField("2000"),
            yearly_limit: decimalField("5000"),
        },

        valid_merchant_categories: {
            type: [{
                type: String,
                enum: MERCHANT_CATEGORIES,
            }],
            default: () => [...MERCHANT_CATEGORIES],
            required: true,
        },

        daily_transaction: {
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
                required: true,
            },
            debit: {
                type: Schema.Types.Decimal128,
                default: () => mongoose.Types.Decimal128.fromString("0"),
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
    },
    {
        timestamps: true,
    }
);

userCardDetailsSchema.index({
    _id: 1,
    cardholder_id: 1
});

const userCardDetailsModel = mongoose.model<userCardDetailsSchemaTypes>(
    "CardDetails",
    userCardDetailsSchema,
    "user_card_details"
);

export { userCardDetailsModel };