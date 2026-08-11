import mongoose, { Types } from "mongoose";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError } from "../utils/AppErrorClass.js";
import type { userDetailsSchemaTypes } from "../types/schemaTypes.js";

const userLoginTransaction = async (userDetails: userDetailsSchemaTypes, deviceId: string, clientIp: string, userAgent: string | null) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        let updatedUser = userDetails;

        // Activate user
        if (userDetails.is_active === "N") {
            updatedUser = await user_details.findByIdAndUpdate(
                    userDetails._id,
                    {
                        is_active: "Y",
                        status: "ACTIVE",
                    },
                    {
                        new: true,
                        session: mongoSession,
                    }
                ).lean() as userDetailsSchemaTypes;

            if (!updatedUser) {
                throw new ServiceError("User login service facing issue - failed to activate user");
            }
        }

        // Update user meta details
        const metaDoc = await user_meta_details.findOneAndUpdate(
                {
                    user_id: updatedUser?._id,
                },
                {
                    device_id: deviceId,
                    ip_address: clientIp,
                    // userAgent: req.headers["user-agent"],
                    userAgent: userAgent,
                    login_at: new Date(),
                },
                {
                    upsert: true,
                    new: true,
                    session: mongoSession,
                }
            ).select("_id verification_code verification_code_expires_at").lean();

        if (!metaDoc) {
            throw new ServiceError("User login service facing issue - failed updating meta details");
        }

        await mongoSession.commitTransaction();

        return {status: "SUCCESS", message: "User login service DB update successfull", data: {userDetailsDoc: updatedUser, userMetaDetailsDoc: metaDoc,}};
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "UserLoginTransactionService",
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `UserLoginTransactionService facing issue: ${error.message
            }`
        );

    }
    finally {
        await mongoSession.endSession();
    }

};

export default userLoginTransaction;