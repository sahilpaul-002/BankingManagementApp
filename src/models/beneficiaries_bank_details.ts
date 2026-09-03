import mongoose, { Schema, Types } from "mongoose";
import type { beneficiariesBankDetailsSchemaTypes } from "../types/schemaTypes.js";
import { BENEFICIARIES_FIAT_CURRENCIES } from "../types/beneficiariesFiatCurrency.js";

const beneficiariesBankDetailsSchema = new Schema<beneficiariesBankDetailsSchemaTypes>({
    user_id: {
        type: Types.ObjectId,
        ref: "UserDetails",
        required: true,
        index: true,
    },

    account_number: {
        type: String,
        required: true,
        index: true
    },

    account_currency: {
        type: String,
        required: true,
        enum: BENEFICIARIES_FIAT_CURRENCIES,
        trim: true,
        uppercase: true
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
    }
}, { timestamps: true }
);

// Same account can exist for different users, but don't allow the same user to add it twice.
beneficiariesBankDetailsSchema.index(
    {
        user_id: 1,
        account_number: 1,
    },
    {
        unique: true,
    }
);

const beneficiariesBankDetailsModel = mongoose.model("BeneficiariesBankDetails", beneficiariesBankDetailsSchema, "beneficiaries_bank_details");

export { beneficiariesBankDetailsModel };