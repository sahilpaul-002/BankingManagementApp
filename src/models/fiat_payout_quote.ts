import mongoose, { Schema } from "mongoose";
import type { fiatPayoutQuoteSchemaTypes } from "../types/schemaTypes.js";

const fiatPayoutQuoteSchema = new Schema<fiatPayoutQuoteSchemaTypes>({
    user_id: {
        type: String,
        required: true,
        index: true,
    },

    wallet_id: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },

    beneficiary_id: {
        type: String,
        required: true,
        index: true,
    },

    // ---------------- SOURCE ----------------

    source_currency: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },

    source_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    // ---------------- DESTINATION ----------------

    destination_currency: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },

    destination_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    gross_destination_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    // ---------------- FX ----------------

    exchange_rate: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    // ---------------- FEES ----------------

    fee_currency: {
        type: String,
        required: true,
        enum: ["USD"],
        default: "USD",
        trim: true,
        uppercase: true,
    },

    fee_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
        default: 0,
    },

    total_debit: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    // ---------------- QUOTE STATUS ----------------

    quote_status: {
        type: String,
        enum: [
            "ACTIVE",
            "USED",
            "EXPIRED",
            "CANCELLED",
        ],
        default: "ACTIVE",
        index: true,
    },

    expires_at: {
        type: Date,
        required: true,
        index: true,
    },
},
    {
        timestamps: true,
    }
);

// Useful for retrieving active quotes belonging to a user
fiatPayoutQuoteSchema.index({
    user_id: 1,
    quote_status: 1,
    createdAt: -1,
});

// Useful for quote expiry/status checks
fiatPayoutQuoteSchema.index({
    quote_status: 1,
    expires_at: 1,
});

const fiatPayoutQuoteModel = mongoose.model("FiatPayoutQuote", fiatPayoutQuoteSchema, "fiat_payout_quotes");

export { fiatPayoutQuoteModel };