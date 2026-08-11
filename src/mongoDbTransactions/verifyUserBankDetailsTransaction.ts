import mongoose, { Types } from "mongoose";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError, NotFoundError } from "../utils/AppErrorClass.js";
import type { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

interface userBankVerificationJwtPayloadType extends JwtPayload {
    userId: string;
    userName: string;
    dashboardName: string;
    action: "APPROVE" | "REJECT";
    userBankRequestId: string;
}

const UserBankVerifyTransaction = async (decoded: userBankVerificationJwtPayloadType) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

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

        if (currentBankDoc?.user_bank_request_id !== decoded.userBankRequestId) {
            throw new ServiceError("Expired verification link");
        }

        // Update the user bank request id
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

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `UserBankVerificationTransactionService facing issue: ${error.message
            }`
        );

    }
    finally {
        await mongoSession.endSession();
    }

};

export default UserBankVerifyTransaction;