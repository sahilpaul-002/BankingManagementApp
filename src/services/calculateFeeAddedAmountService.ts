import { Decimal } from "decimal.js";
import { FEE_DETAILS } from "../configs/configConstants.js";
import type { feeDetailsSchemaTypes } from "../types/schemaTypes.js";

type FeeType = "load_fiat_wallet_percent" | "load_crypto_wallet_percent" | "card_transaction_percent";

export const calculateFeeAddedAmountService = (
    amount: Decimal,
    feeType: FeeType
): Decimal => {

    if (!amount.isFinite() || amount.isNegative()) {
        throw new Error("Amount must be a valid non-negative number");
    }

    const feePercentage = new Decimal(
        FEE_DETAILS[feeType].toString()
    );

    return amount
        .mul(feePercentage)
        .div(100)
        .toDecimalPlaces(4);
};