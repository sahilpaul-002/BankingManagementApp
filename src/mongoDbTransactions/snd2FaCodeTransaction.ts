import mongoose, { Types } from "mongoose";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";

const Send2FaCodeTransaction = async (userId: Types.ObjectId, hashedVerificationCode: string, verificationCodeExpiry: Date) => {
    const mongoSession = await mongoose.startSession();
    try {

        mongoSession.startTransaction();

        // Update user details
        const updatedUserDoc = await user_details.findByIdAndUpdate(
            userId,
            {
                is_2fa_enabled: "Y",
                two_fa_type: "EMAIL-OTP",
                authenticator_secret: null
            },
            {
                new: true,
                runValidators: true,
                session: mongoSession
            }
        ).select("_id").lean();

        if (!updatedUserDoc) {
            throw new ServiceError("Failed to update two factor methods for user details.")
        }

        // Update user meta details
        const updatedMetaDoc = await user_meta_details.findOneAndUpdate(
            {
                user_id: userId
            },
            {
                verification_code: hashedVerificationCode,
                verification_code_expires_at: verificationCodeExpiry
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                session: mongoSession
            }
        ).select("_id").lean();

        if (!updatedMetaDoc) {
            throw new ServiceError("Failed to update user meta details");
        }

        await mongoSession.commitTransaction();

        return {
            status: "SUCCESS",
            data: {
                userDetailsDoc: updatedUserDoc,
                userMetaDetailsDoc: updatedMetaDoc
            }
        };
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(error, { serviceName: "Send2FaCodeTransaction" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`Send2FaCodeTransaction facing issue: ${error.message}`);
    }
    finally {
        await mongoSession.endSession();
    }

};

export default Send2FaCodeTransaction;