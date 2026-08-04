import mongoose, { Schema, Types } from "mongoose";
import type { beneficiariesBankDetailsSchemaTypes } from "../types/schemaTypes.js";

const beneficiariesBankDetailsSchema = new Schema<beneficiariesBankDetailsSchemaTypes>({
    account_number: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    account_currency: {

    },

    account_holder_name: {
        type: String,
        required: true
    },
    swift_code: {
        type: String,
        required: true
    },
    iban_code: {
        type: String,
        required: true
    },
    bank_name: {
        type: String,
        required: true
    },
    is_verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }
);

const beneficiariesBankDetailsModel = mongoose.model("BeneficiariesBankDetails", beneficiariesBankDetailsSchema, "beneficiaries_bank_details");

export { beneficiariesBankDetailsModel };