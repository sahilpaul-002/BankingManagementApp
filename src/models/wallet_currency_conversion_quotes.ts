import mongoose, { Schema } from "mongoose";
import type { walletCurrencyConversionQuoteSchemaTypes } from "../types/schemaTypes.js";

const walletCurrencyConversionQuoteSchema = new Schema<walletCurrencyConversionQuoteSchemaTypes>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        cardholder_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        wallet_id: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        source_currency: {
            type: String,
            required: true,
            enum: ["USD", "EUR", "SGD", "USDC", "USDT"],
        },

        source_amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        destination_currency: {
            type: String,
            required: true,
            enum: ["USD", "EUR", "SGD", "USDC", "USDT"],
        },

        destination_amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        exchange_rate: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        fee_percentage: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        fee_amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        quote_status: {
            type: String,
            required: true,
            enum: [
                "ACTIVE",
                "EXECUTED",
                "EXPIRED",
                "FAILED",
            ],
            default: "ACTIVE",
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

const walletCurrencyConversionQuoteModel = mongoose.model(
    "WalletCurrencyConversionQuote",
    walletCurrencyConversionQuoteSchema,
    "wallet_currency_conversion_quotes"
);

    export { walletCurrencyConversionQuoteModel }; 