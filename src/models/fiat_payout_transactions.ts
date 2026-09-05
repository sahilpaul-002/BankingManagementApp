import mongoose, { Schema, Types } from "mongoose";
import type { fiatPayoutTransactionsSchemaTypes } from "../types/schemaTypes.js";

const fiatPayoutTransactionsSchema = new Schema<fiatPayoutTransactionsSchemaTypes>({
    quote_id: {
        type: Schema.Types.ObjectId,
        ref: "FiatPayoutQuote",
        required: true,
        index: true,
    },

    user_id: {
        type: Schema.Types.ObjectId,
        ref: "UserDetails",
        required: true,
        index: true,
    },

    wallet_id: {
        type: Schema.Types.ObjectId,
        ref: "WalletDetails",
        required: true,
        index: true,
    },

    beneficiary_id: {
        type: Schema.Types.ObjectId,
        ref: "BeneficiariesBankDetails",
        required: true,
        index: true,
    },

    source_currency: {
        type: String,
        required: true,
    },

    source_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    destination_currency: {
        type: String,
        required: true,
    },

    destination_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    exchange_rate: {
        type: Schema.Types.Decimal128,
        required: true,
        min: 0,
    },

    fee_amount: {
        type: Schema.Types.Decimal128,
        required: true,
        default: () => mongoose.Types.Decimal128.fromString("0"),
        min: 0,
    },

    status: {
        type: String,
        enum: [
            "PENDING",
            "PROCESSING",
            "SUCCESS",
            "FAILED",
            "CANCELLED",
        ],
        default: "PENDING",
        index: true,
    },

    processing_started_at: {
        type: Date,
        default: null,
        index: true,
    },

    completed_at: {
        type: Date,
        default: null,
    },

    provider_reference: {
        type: String,
        default: null,
    },

    remarks: {
        type: String,
        default: null,
    },
},
    {
        timestamps: true,
    }
);

const fiatPayoutTransactionsModel = mongoose.model("FiatPayoutTransactions", fiatPayoutTransactionsSchema, "fiat_payout_transactions");

export { fiatPayoutTransactionsModel };