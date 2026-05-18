import mongoose, { Schema, Types } from "mongoose";
import type { userKycDetailsSchemaTypes } from "../types/schemaTypes.js";

const userKycDetailsSchema = new Schema<userKycDetailsSchemaTypes>(
    {
        user_id: {
            type: Types.ObjectId,
            ref: "user_details",
            unique: true,
            required: true,
            index: true,
        },

        kyc_status: {
            type: String,
            enum: ["PENDING", "IN-PROGRESS", "RFI", "COMPLETED"],
            default: "PENDING",
        },

        poi_number: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        poa_number: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        poi_document: {
            type: String,
            required: true,
        },

        poa_document: {
            type: String,
            required: true,
        },

        kyc_request_id: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const userKycDetailsModel = mongoose.model<userKycDetailsSchemaTypes>(
    "UserKycDetails",
    userKycDetailsSchema,
    "user_kyc_details"
);

export { userKycDetailsModel };