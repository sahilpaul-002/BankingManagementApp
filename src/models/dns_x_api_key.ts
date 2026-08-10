import mongoose, { Schema } from "mongoose";
import type { dnsXApiKeySchemaTypes } from "../types/schemaTypes.js";

const dnsXApiKeySchema = new Schema<dnsXApiKeySchemaTypes>(
    {
        domain_name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },

        x_api_key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const dnsXApiKeyModel = mongoose.model<dnsXApiKeySchemaTypes>("DnsXApiKeys", dnsXApiKeySchema, "dns_x_api_keys");

export {dnsXApiKeyModel};