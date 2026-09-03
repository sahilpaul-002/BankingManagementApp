import {Decimal} from "decimal.js";
import { Types } from "mongoose";
import z from "zod";

const SOURCE_WALLET_CURRENCIES = ["USD", "EUR", "SGD"] as const;

const createFiatPayoutQuoteValidationSchema = z.object({
    beneficiary_id: z
        .string("Beneficiary ID is required")
        .trim()
        .refine(
            (value) => Types.ObjectId.isValid(value),
            "Invalid beneficiary ID"
        ),

    source_wallet_currency: z
        .string("Source wallet currency is required")
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(SOURCE_WALLET_CURRENCIES)
        ),

    source_amount: z
        .instanceof(Decimal)
        .refine(
            (value) => value.greaterThan(0),
            "Source amount must be greater than 0"
        ),
}).strict();

export default createFiatPayoutQuoteValidationSchema;