import {Decimal} from "decimal.js";
import { FEE_DETAILS } from "../configs/configConstants.js";

export const deductPayoutFees = (
    amount: Decimal
): {
    feeAmount: Decimal;
    amountAfterFee: Decimal;
} => {

    if (amount.isNegative()) {
        throw new Error("Amount cannot be negative");
    }

    const feePercentage = new Decimal(
        FEE_DETAILS.p2P_percent.toString()
    );

    const feeAmount = amount
        .mul(feePercentage)
        .div(100)
        .toDecimalPlaces(2);

    const amountAfterFee = amount
        .minus(feeAmount)
        .toDecimalPlaces(2);

    return {
        feeAmount,
        amountAfterFee,
    };
};

export default deductPayoutFees;