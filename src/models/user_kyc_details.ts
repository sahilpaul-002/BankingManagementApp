import mongoose, { Schema, Types } from "mongoose";
import type { userKycDetailsSchemaTypes } from "../types/schemaTypes.js";
import crypto from "crypto";

const userKycDetailsSchema = new Schema<userKycDetailsSchemaTypes>(
    {
        user_id: {
            type: Types.ObjectId,
            unique: true,
            required: true,
            index: true,
        },

        kyc_status: {
            type: String,
            enum: ["PENDING", "IN-PROGRESS", "RFI", "COMPLETED"],
            default: "PENDING",
        },

        poi_document: {
            poi_number: {
                type: String,
                required: true,
                unique: true,
            },
            secure_url: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
                required: true,
            }
        },

        poa_document: {
            poa_number: {
                type: String,
                required: true,
                unique: true,
            },
            secure_url: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
                required: true,
            }
        },

        kyc_request_id: {
            type: String,
            required: true,
            unique: true,
            default: () => crypto.randomUUID()
        },

        deleted_at: {
            type: Date,
            optional: true
        }
    },
    { timestamps: true }
);

const userKycDetailsModel = mongoose.model<userKycDetailsSchemaTypes>(
    "UserKycDetails",
    userKycDetailsSchema,
    "user_kyc_details"
);

export { userKycDetailsModel };