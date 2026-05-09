import mongoose, { Schema } from "mongoose";
import type { userMetaDetailsSchemaTypes } from "../types/schemaTypes.js";

const userMetaDetailsSchema = new Schema<userMetaDetailsSchemaTypes>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "user_details", // Foreign key reference to user_details collection
        required: true,
    },
    device_id: {
        type: String,
        required: true,
    },
    ip_address: {
        type: String,
        required: true,
    },
    userAgent: {
        type: String,
    },
    login_at: {
        type: Date,
        default: Date.now,
    },
    verification_code: {
        type: String,
    },
    verification_code_expires_at: {
        type: Date,
    }
},
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const userMetaDetailsModel = mongoose.model<userMetaDetailsSchemaTypes>("UserMetaDetails", userMetaDetailsSchema, "user_meta_details");

export { userMetaDetailsModel };