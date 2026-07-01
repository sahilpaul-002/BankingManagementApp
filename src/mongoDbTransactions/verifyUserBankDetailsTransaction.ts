import mongoose, { Types } from "mongoose";
import { userBankDetailsModel as user_bank_details } from "../models/user_bank_details.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError, NotFoundError } from "../utils/AppErrorClass.js";
import type { JwtPayload } from "jsonwebtoken";

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

        // Verify request id
        const currentBankDoc = await user_bank_details
            .findOne(
                {
                    user_id: decoded.userId,
                },
                null,
                {
                    session: mongoSession,
                }
            ).lean();

        if (currentBankDoc?.user_bank_request_id !== decoded.userBankRequestId) {
            throw new ServiceError("Expired verification link");
        }

        // Update the user bank request id
        const updatedRequestDoc = await user_bank_details.findOneAndUpdate(
            {
                user_id: decoded.userId,
            },
            {
                user_bank_request_id: crypto.randomUUID(),
            },
            {
                new: true,
                runValidators: true,
                session: mongoSession,
            }
        )
            .lean();

        if (!updatedRequestDoc) {
            throw new ServiceError("Failed to update user bank details request_id");
        }

        const userDoc = await user_details.findById(
            decoded.userId,
            null,
            {
                session: mongoSession,
            }
        )
            .lean();

        if (!userDoc) {
            throw new NotFoundError("User details not found");
        }

        let updatedBankDoc = null;
        let updatedUserDoc = null;

        if (decoded.action === "APPROVE") {
            updatedBankDoc = await user_bank_details.findOneAndUpdate(
                {
                    user_id: decoded.userId,
                },
                {
                    is_verified: true,
                },
                {
                    new: true,
                    session: mongoSession,
                }
            )
                .lean();

            if (!updatedBankDoc) {
                throw new ServiceError("VerifyUserBankDetails service facing issue - failed to update the user details for bank account status")
            }

            updatedUserDoc = await user_details.findByIdAndUpdate(
                decoded.userId,
                {
                    cardholder_id: crypto.randomUUID(),
                },
                {
                    new: true,
                    session: mongoSession,
                }
            )
                .lean();

            if (!updatedUserDoc) {
                throw new ServiceError("VerifyUserBandDetails service is facing issue - failed to add cardholder-id ");
            }
        }

        if (decoded.action === "REJECT") {
            updatedBankDoc =
                await user_bank_details
                    .findOneAndUpdate(
                        {
                            user_id: decoded.userId,
                        },
                        {
                            is_verified: false,
                        },
                        {
                            new: true,
                            session: mongoSession,
                        }
                    )
                    .lean();

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