import mongoose, { Types } from "mongoose";
import { userAddressDetailsModel as user_address_details } from "../models/user_addresses_details.js";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError } from "../utils/AppErrorClass.js";

// Type for User Bank Details Payload
export interface userBankDetailsPayloadType {
    user_id: Types.ObjectId;
    account_holder_name: string;
    account_number: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    is_verified?: boolean;
    user_bank_request_id: string;
}

// Type for User Address Details Payload
export interface billingAddressTypes {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: "Billing";
}
export interface deliveryAddressTypes {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: "Delivery";
}
export interface userAddressDetailsPayloadType {
    user_id: Types.ObjectId;
    billing_address: billingAddressTypes;
    delivery_address: deliveryAddressTypes;
}

const userOnboardingTransaction = async (userId: string, addressDocument: userAddressDetailsPayloadType, bankDocument: userBankDetailsPayloadType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        const existingAddress = await user_address_details.findOne({ user_id: userId }, null, { session: mongoSession }).lean();

        const existingBank = await user_bank_details.findOne({ user_id: userId }, null, { session: mongoSession }).lean();

        let addressResult = null;
        let bankResult = null;
        let message = "";

        // ADDRESS UPSERT
        if (!existingAddress) {
            addressResult = await user_address_details.create([addressDocument], { session: mongoSession });
            addressResult = addressResult[0]?.toObject();
        }
        else {
            const { user_id, ...addressUpdate } = addressDocument;

            addressResult = await user_address_details.findOneAndUpdate({ user_id: userId }, addressUpdate,
                {
                    new: true,
                    runValidators: true,
                    session: mongoSession
                }
            ).lean();
        }

        // BANK UPSERT
        if (!existingBank) {
            bankResult = await user_bank_details.create([bankDocument], { session: mongoSession });

            bankResult = bankResult[0]?.toObject();
        }
        else {
            if (existingBank.is_verified) {
                throw new ServiceError("Bank details already verified");
            }

            const { user_id, ...bankUpdate } = bankDocument;

            bankResult = await user_bank_details.findOneAndUpdate(
                {
                    user_id: userId,
                },
                {
                    ...bankUpdate,
                    is_verified: false,
                },
                {
                    new: true,
                    runValidators: true,
                    session: mongoSession,
                }
            ).lean();
        }

        if (!existingAddress && !existingBank) {
            message = "User address and bank details added successfully"
        }
        else if (!existingAddress && existingBank) {
            message = "Address added and bank details updated successfully"
        }
        else if (existingAddress && !existingBank) {
            message = "Bank details added and address updated successfully"
        }
        else {
            message = "User onboarding details updated successfully"
        }

        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message,
            data: {
                addressDetails: addressResult,
                bankDetails: bankResult,
            },
        };
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "UserOnboardingTransactionService",
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `UserOnboardingTransactionService facing issue: ${error.message
            }`
        );

    }
    finally {
        await mongoSession.endSession();
    }

};

export default userOnboardingTransaction;