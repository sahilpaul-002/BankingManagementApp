import {Decimal} from "decimal.js";
import { FEE_DETAILS } from "../configs/configConstants.js";
import type { feeDetailsSchemaTypes } from "../types/schemaTypes.js";

type FeeType = Exclude<
    keyof feeDetailsSchemaTypes,
    "_id" | "fee_unit"
>;

const feeDetails: feeDetailsSchemaTypes = FEE_DETAILS;

export const deductFeeService = (
    amount: Decimal,
    feeType: FeeType
): Decimal => {

    if (amount.isNegative()) {
        throw new Error("Amount cannot be negative");
    }

    const feePercentage = new Decimal(
        feeDetails[feeType].toString()
    );

    const feeAmount = amount
        .mul(feePercentage)
        .div(100);

    const finalAmount = amount
        .minus(feeAmount)
        .toDecimalPlaces(2);

    return finalAmount;
};

export default deductFeeService;