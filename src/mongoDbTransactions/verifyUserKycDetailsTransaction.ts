import mongoose, { Types } from "mongoose";
import { userKycDetailsModel as user_kyc_details } from "../models/user_kyc_details.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError, NotFoundError } from "../utils/AppErrorClass.js";
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
    const mongoSession = await mongoose.startSession();
    try {

        mongoSession.startTransaction();

        // Verify token
        const currentKycDoc = await user_kyc_details.findOne(
            {
                user_id: decoded.userId,
            },
            null,
            {
                session: mongoSession,
            }
        ).lean();
        if (currentKycDoc?.kyc_request_id !== decoded?.kycRequestId) {
            return { status: "SERVICE_ERROR", message: "Exipred verification link or RFI requested" }
        }

        // Rotate Request ID
        const updatedRequestDoc = await user_kyc_details.findOneAndUpdate(
            {
                user_id: decoded.userId
            },
            {
                kyc_request_id: crypto.randomUUID()
            },
            {
                new: true,
                runValidators: true,
                session:
                    mongoSession
            }
        )
            .lean();
        if (!updatedRequestDoc) {
            throw new ServiceError("Failed to update KYC request id");
        }

        // Update Status
        const updatedStatus = decoded.action === "APPROVE" ? "COMPLETED" : "RFI";

        // Update KYC Status
        const updatedKycDoc = await user_kyc_details.findOneAndUpdate(
            {
                user_id: decoded.userId
            },
            {
                kyc_status: updatedStatus
            },
            {
                new: true,
                session: mongoSession
            }
        ).lean();

        if (!updatedKycDoc) {
            throw new ServiceError("Failed to update the kyc details for kyc status")
        }


        const updatedUserDoc = await user_details.findByIdAndUpdate(
            decoded.userId,
            {
                kyc_status: updatedStatus
            },
            {
                new: true,
                session: mongoSession
            }
        ).lean();

        if (!updatedUserDoc) {
            throw new ServiceError("Failed to update the user details for kyc status")
        }

        // Commit
        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message: "KYC verification status updated successfully",
            data: {
                userKycDetailsDoc: updatedKycDoc,
                userDetailsDoc: updatedUserDoc
            }
        };

    }

    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, { serviceName: "UserKycVerifyUpdateTransaction" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`UserKycVerifyUpdateTransaction facing issue: ${error.message}`);
    }
    finally {
        await mongoSession.endSession();
    }

};

export default UserKycVerifyUpdateTransaction;