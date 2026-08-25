import mongoose, { Types } from "mongoose";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userFundingBankAccountDetailsModel as user_funding_bank_account_details } from "../models/user_funding_bank_account_details.js";
import { userCryptoDepositAccountDetailsModel as user_crypto_deposit_account_details } from "../models/user_crypto_deposit_accout_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError, NotFoundError } from "../utils/AppErrorClass.js";
import type { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import sanitizeApiError from "../utils/sanitizeApiError.js";

interface userBankVerificationJwtPayloadType extends JwtPayload {
    userId: string;
    userName: string;
    dashboardName: string;
    action: "APPROVE" | "REJECT";
    userBankRequestId: string;
}

interface userCryptoDepositAccountDetailsTypes {
    user_id: Types.ObjectId;
    cardholder_id: Types.ObjectId;
    network: "ETHEREUM" | "POLYGON";
    asset: "USDT" | "USDC";
    deposit_address: string;
    account_balance: Types.Decimal128;
    is_active: boolean;
}

const userBankVerifyTransaction = async (decoded: userBankVerificationJwtPayloadType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        if (!Types.ObjectId.isValid(decoded.userId)) {
            throw new NotFoundError("User id not found")
        }
        const userId = new Types.ObjectId(decoded.userId)

        // Verify request id
        const currentBankDoc = await user_bank_details.findOne(
            {
                user_id: userId as Types.ObjectId,
            },
            null,
            {
                session: mongoSession,
            }
        ).select("_id user_bank_request_id").lean();
        if (!currentBankDoc) {
            throw new NotFoundError("User bank details not found");
        }

        if (currentBankDoc?.user_bank_request_id !== decoded.userBankRequestId) {
            throw new ServiceError("Expired verification link");
        }

        // Invalidate and update the user bank request id
        const updatedRequestDoc = await user_bank_details.findOneAndUpdate(
            {
                user_id: userId as Types.ObjectId,
            },
            {
                user_bank_request_id: crypto.randomUUID(),
            },
            {
                new: true,
                runValidators: true,
                session: mongoSession,
            }
        ).select("_id").lean();

        if (!updatedRequestDoc) {
            throw new ServiceError("Failed to update user bank details request_id");
        }

        const userDoc = await user_details.findById(
            userId,
            null,
            {
                session: mongoSession,
            }
        ).select("email").lean();

        if (!userDoc) {
            throw new NotFoundError("User details not found");
        }

        let updatedBankDoc = null;
        let updatedUserDoc = userDoc;
        if (decoded.action === "APPROVE") {
            const cardholderId = new Types.ObjectId();

            updatedBankDoc = await user_bank_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId,
                },
                {
                    cardholder_id: cardholderId as Types.ObjectId,
                    is_verified: true,
                },
                {
                    new: true,
                    session: mongoSession,
                }
            ).select("_id").lean();

            if (!updatedBankDoc) {
                throw new ServiceError("VerifyUserBankDetails service facing issue - failed to update the user details for bank account status")
            }

            const updatedUser = await user_details.findByIdAndUpdate(
                userId,
                {
                    cardholder_id: cardholderId,
                },
                {
                    new: true,
                    runValidators: true,
                    session: mongoSession,
                }
            ).select("email").lean();

            if (!updatedUser) {
                throw new ServiceError("VerifyUserBandDetails service is facing issue - failed to add cardholder-id ");
            }

            updatedUserDoc = updatedUser;

            // Create application-provided USD funding bank account
            const fundingAccountNumber = crypto.randomInt(
                1000000000,
                9999999999
            ).toString();
            const fundingBankAccount = await user_funding_bank_account_details.create([
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    account_holder_name: decoded.userName,
                    account_number: fundingAccountNumber,
                    account_currency: "USD",
                    account_balance: mongoose.Types.Decimal128.fromString("0"),
                    swift_code: "DEMOUS33XXX",
                    iban_code: `US${fundingAccountNumber}`,
                    bank_name: "DBS Financial Bank",
                    is_active: true
                }
            ],
                {
                    session: mongoSession
                }
            );
            if (!fundingBankAccount?.length) {
                throw new ServiceError("Failed to create user funding bank account");
            }

            // Create application-provided crypto deposit account
            const generateCryptoDepositAddress = (): string => { return `0x${crypto.randomBytes(20).toString("hex")}`; };
            const cryptoDepositAccounts: userCryptoDepositAccountDetailsTypes[] = [
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    network: "ETHEREUM",
                    asset: "USDT",
                    deposit_address: generateCryptoDepositAddress(),
                    account_balance: mongoose.Types.Decimal128.fromString("0"),
                    is_active: true
                },
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    network: "ETHEREUM",
                    asset: "USDC",
                    deposit_address: generateCryptoDepositAddress(),
                    account_balance: mongoose.Types.Decimal128.fromString("0"),
                    is_active: true
                },
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    network: "POLYGON",
                    asset: "USDT",
                    deposit_address: generateCryptoDepositAddress(),
                    account_balance: mongoose.Types.Decimal128.fromString("0"),
                    is_active: true
                },
                {
                    user_id: userId,
                    cardholder_id: cardholderId,
                    network: "POLYGON",
                    asset: "USDC",
                    deposit_address: generateCryptoDepositAddress(),
                    account_balance: mongoose.Types.Decimal128.fromString("0"),
                    is_active: true
                }
            ];
            const createdCryptoAccounts = await user_crypto_deposit_account_details.create(
                    cryptoDepositAccounts,
                    {
                        session: mongoSession,
                        ordered: true
                    }
                );
            if (createdCryptoAccounts?.length !== 4) {
                throw new ServiceError("Failed to create user crypto deposit accounts");
            }
        }

        if (decoded.action === "REJECT") {
            updatedBankDoc = await user_bank_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId,
                },
                {
                    is_verified: false,
                },
                {
                    new: true,
                    session: mongoSession,
                }
            ).select("_id").lean();

            if (!updatedBankDoc) {
                throw new ServiceError("VerifyUserBankDetails service facing issue - failed to update the user details for bank account status")
            }
        }

        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message: "VerifyUserBankDetails service DB update successfull",
            data: {
                userBankDetailsDoc: updatedBankDoc,
                userDetailsDoc: updatedUserDoc,
            },
        };
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "UserBankVerificationTransactionService",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UserBankVerificationTransactionService facing issue`, sanitizedError);

    }
    finally {
        await mongoSession.endSession();
    }

};

export default userBankVerifyTransaction;