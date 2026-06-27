import { FEE_DETAILS } from "../configs/configConstants.js";
import type { feeDetailsSchemaTypes } from "../types/schemaTypes.js";

type FeeType = Exclude<keyof feeDetailsSchemaTypes,"_id" | "fee_unit">;

const feeDetails: feeDetailsSchemaTypes = FEE_DETAILS

export const deductFeeSrive = (amount: number, feeType: FeeType): number => {
    if (amount < 0) {
        throw new Error("Amount cannot be negative");
    }

    const feePercentage = feeDetails[feeType];

    const feeAmount = (amount * feePercentage) / 100;

    const finalAmount = amount - feeAmount;

    return Number(finalAmount.toFixed(2));
};

export default deductFeeSrive;