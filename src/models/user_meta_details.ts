import mongoose, { Schema, type HydratedDocument } from "mongoose";
import type { userMetaDetailsSchemaTypes } from "../types/schemaTypes.js";

export type UserMetaDetailsDocument =
    HydratedDocument<userMetaDetailsSchemaTypes>;

const userMetaDetailsSchema = new Schema<userMetaDetailsSchemaTypes>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "user_details", // Foreign key reference to user_details collection
        required: true,
    },
    device_id: {
        type: String,
        default: null
    },
    ip_address: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    login_at: {
        type: Date,
        default: Date.now,
    },
    verification_code: {
        type: String,
        default: null
    },
    verification_code_expires_at: {
        type: Date,
        default: null
    }
},
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const userMetaDetailsModel = mongoose.model<userMetaDetailsSchemaTypes>("UserMetaDetails", userMetaDetailsSchema, "user_meta_details");

export { userMetaDetailsModel };