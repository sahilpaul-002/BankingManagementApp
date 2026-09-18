import mongoose, { Types } from "mongoose";
import { userAddressDetailsModel as user_address_details } from "../models/user_addresses_details.js";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError } from "../utils/AppErrorClass.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

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

const userOnboardingTransaction = async (userId: Types.ObjectId, addressDocument: userAddressDetailsPayloadType, bankDocument: userBankDetailsPayloadType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        // Check address details existance
        const existingAddress = await user_address_details.exists(
            { user_id: userId }
        );

        // ADDRESS UPSERT
        const { user_id, ...addressUpdate } = addressDocument;

        const addressResult = await user_address_details.findOneAndUpdate(
            { user_id: userId },
            {
                $set: addressUpdate,
                $setOnInsert: {
                    user_id: userId,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                session: mongoSession,
            }
        ).lean();

        // Check bank details existance
        const existingUserBank = await user_bank_details
            .findOne(
                { user_id: userId },
                null,
                { session: mongoSession }
            )
            .select("_id is_verified account_holder_name account_number swift_code iban_code bank_name")
            .lean();

        const existingAccountNumber = await user_bank_details
            .findOne(
                {
                    account_number: bankDocument.account_number,
                    ...(existingUserBank
                        ? { _id: { $ne: existingUserBank._id } }
                        : {}),
                },
                null,
                { session: mongoSession }
            )
            .select("_id user_id account_number")
            .lean();
        if (existingAccountNumber) {
            throw new ServiceError(
                "Bank details already exist with the same account number"
            );
        }

        let bankResult;
        // BANK UPSERT
        if (!existingUserBank) {
            bankResult = await user_bank_details.create([bankDocument], { session: mongoSession });
            bankResult = bankResult[0]?.toObject();
        }
        else if (!existingUserBank.is_verified) {
            const { user_id, ...bankUpdate } = bankDocument;

            bankResult = await user_bank_details.findOneAndUpdate(
                {
                    user_id: userId,
                },
                {
                    $set: {
                        ...bankUpdate,
                        is_verified: false,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                    session: mongoSession,
                }
            ).lean();
        }
        else {
            bankResult = existingUserBank;
        }

        let message: string;
        if (!existingAddress && !existingUserBank) {
            message = "User address and bank details added successfully"
        }
        else if (!existingAddress && existingUserBank) {
            message = "Address added and bank details updated successfully"
        }
        else if (existingAddress && !existingUserBank) {
            message = "Bank details added and address updated successfully"
        }
        else if (existingAddress && existingUserBank && existingUserBank?.is_verified) {
            message = "Address details updated successfully and Bank details already verified - cannot be updated "
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

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UserOnboardingTransactionService facing issue`, sanitizedError);

    }
    finally {
        await mongoSession.endSession();
    }

};

export default userOnboardingTransaction;