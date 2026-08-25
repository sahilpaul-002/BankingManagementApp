import mongoose, { Types } from "mongoose";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

const resetUserPasswordTransaction = async (userId: Types.ObjectId, hashedPassword: string) => {

    const mongoSession = await mongoose.startSession();

    try {

        mongoSession.startTransaction();

        // Update user password
        const updatedUserDetails = await user_details.findByIdAndUpdate(
            userId,
            {
                password: hashedPassword,
            },
            {
                new: true,
                session: mongoSession,
            }
        ).select("_id").lean();
        if (!updatedUserDetails) {
            throw new ServiceError("Reset password service facing issue - failed to update user password");
        }

        // Clear reset password verification code
        const updatedUserMetaDetails = await user_meta_details.updateOne(
            {
                user_id: userId,
            },
            {
                $unset: {
                    verification_code: "",
                    verification_code_expires_at: "",
                },
            },
            {
                session: mongoSession,
            }
        );

        if (updatedUserMetaDetails.matchedCount === 0) {
            throw new ServiceError(
                "Reset password service facing issue - failed to clear verification code"
            );
        }

        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            message: "Reset password service DB update successful",
            data: {
                userDetailsDoc: updatedUserDetails,
            },
        };

    }
    catch (err) {

        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ResetPasswordTransactionService",
            }
        );

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`ResetPasswordTransactionService facing issue`, sanitizedError);

    }
    finally {

        await mongoSession.endSession();

    }
};

export default resetUserPasswordTransaction;