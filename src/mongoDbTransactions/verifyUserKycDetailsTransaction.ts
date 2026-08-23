import mongoose, { Types } from "mongoose";
import { userKycDetailsModel as user_kyc_details } from "../models/user_kyc_details.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import logger from "../utils/logger.js";
import {AppErrorClass, NotFoundError, ServiceError,} from "../utils/AppErrorClass.js";
import type { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

interface userKycVerificationJwtPayloadType extends JwtPayload {
    userId: string;
    userName: string;
    dashboardName: string;
    adminEmail: string;
    action: "APPROVE" | "REJECT";
    kycRequestId: string;
}

const UserKycVerifyUpdateTransaction = async (decoded: userKycVerificationJwtPayloadType) => {
    // Get user id
    if (!Types.ObjectId.isValid(decoded?.userId)) {
        throw new NotFoundError("User id not found")
    }
    const userId = new Types.ObjectId(decoded?.userId)

    const mongoSession = await mongoose.startSession();

    try {
        mongoSession.startTransaction();

        // Determine the new KYC status
        const updatedStatus = decoded.action === "APPROVE" ? "COMPLETED" : "RFI";

        // Atomically:
        // 1. Verify the KYC request ID
        // 2. Rotate the KYC request ID
        // 3. Update the KYC status
        const updatedKycDoc = await user_kyc_details.findOneAndUpdate(
                {
                    user_id: userId as Types.ObjectId,
                    kyc_request_id: decoded.kycRequestId,
                },
                {
                    $set: {
                        kyc_request_id: crypto.randomUUID(),
                        kyc_status: updatedStatus,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                    projection: { _id: 1 },
                    session: mongoSession,
                }
            ).lean();

        // No document means either:
        // - Invalid/expired verification link
        // - KYC document does not exist
        // - Request ID has already been rotated
        if (!updatedKycDoc) {
            return {status: "SERVICE_ERROR", message: "Expired verification link or RFI requested"};
        }

        // Update the user's KYC status
        const updatedUserDoc = await user_details.findByIdAndUpdate(
                userId as Types.ObjectId,
                {
                    $set: {
                        kyc_status: updatedStatus,
                    },
                },
                {
                    new: true,
                    session: mongoSession,
                }
            ).select("email").lean();

        if (!updatedUserDoc) {
            throw new ServiceError(
                "Failed to update the user details for kyc status"
            );
        }

        // Commit transaction
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message: "KYC verification status updated successfully",
            data: {
                userKycDetailsDoc: updatedKycDoc,
                userDetailsDoc: updatedUserDoc,
            },
        };
    } catch (error: any) {
        await mongoSession.abortTransaction();

        logger.error(error, {
            serviceName: "UserKycVerifyUpdateTransaction",
        });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UserKycVerifyUpdateTransaction facing issue: ${error.message}`);
    } finally {
        await mongoSession.endSession();
    }
};

export default UserKycVerifyUpdateTransaction;