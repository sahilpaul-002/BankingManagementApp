import mongoose, { Types } from "mongoose";
import type { Request, Response } from "express";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError, InvalidRequestBodyError, ForbiddenError } from "../utils/AppErrorClass.js";
import type { userDetailsDocumentType, userDetailsSchemaTypes } from "../types/schemaTypes.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

const userSignUpTransaction = async (req: Request, res: Response, document: userDetailsDocumentType) => {
    const mongoSession = await mongoose.startSession();

        mongoSession.startTransaction();

        // TO HANDLE THE RACE CONDITION TWO CONCURRENT REQUEST ACTING AS THE PRIMARY USER WHEN CREATED ENTIRE LIGIC IN TRANSACTION

        // Insert document into user_details collection
        let insertedDocument
        try {
            insertedDocument = await user_details.create(
                [document],
                { session: mongoSession }
            );

            await mongoSession.commitTransaction();

            return {
                status: "SUCCESS",
                message: "Document inserted successfully",
                data: insertedDocument[0]
            };
        }
        catch (err) {
            const error = err as any;

            // Abort the transaction is the transaction is active
            if (mongoSession.inTransaction()) {
                await mongoSession.abortTransaction();
            }

            // Handle duplicate key
            if (error?.code === 11000) {
                /*
                 * A duplicate can happen because another concurrent
                 * request inserted the same unique document.
                 *
                 * We do NOT blindly assume every 11000 means
                 * primary-user race condition.
                 */

                const keyPattern = error?.keyPattern || {};

                const isPrimaryUserDuplicate = keyPattern?.business_name === 1 && keyPattern?.agent_code === 1 && keyPattern?.subagent_code === 1;


                // Primary user race condition
                if (isPrimaryUserDuplicate && document.agent_code === "01" && document.subagent_code === "01") {
                    /*
                     * Another concurrent request successfully
                     * created 01/01.
                     *
                     * Now create this user as 01/02.
                     */
                    const retrySession = await mongoose.startSession();

                    try {
                        retrySession.startTransaction();

                        // Create secondary user document
                        const retryDocument: userDetailsDocumentType = {
                            ...document,
                            subagent_code: "02",
                            is_admin: "N",
                        };

                        // Get primary user create by concorent request
                        const existingPrimaryUser = await user_details.findOne({
                            business_name: document.business_name,
                            agent_code: "01",
                            subagent_code: "01",
                        })
                            .select("business_id program_type")
                            .session(retrySession)
                            .lean();


                        if (!existingPrimaryUser) {
                            throw new ServiceError("Primary user was created concurrently but could not be found");
                        }

                        // User primary user business id
                        retryDocument.business_id = existingPrimaryUser.business_id;

                        // Insert secondary user
                        const retryInsert = await user_details.create(
                            [retryDocument],
                            {
                                session: retrySession,
                            }
                        );


                        // Commit retry transaction
                        await retrySession.commitTransaction();


                        return {
                            status: "SUCCESS",
                            message: "Document inserted successfully",
                            data: retryInsert[0],
                        };

                    }
                    catch (retryErr) {

                        const retryError = retryErr as any;

                        // Abort retry transaction
                        if (retrySession.inTransaction()) {
                            await retrySession.abortTransaction();
                        }

                        // Log retry error
                        logger.error(
                            retryError,
                            {
                                serviceName: "UserSignUpRetryTransactionService",
                                business_name: document.business_name,
                                email: document.email,
                            }
                        );

                        if (retryError instanceof AppErrorClass) {
                            throw retryError;
                        }

                        // Duplicate error during retry
                        if (retryError?.code === 11000) {
                            throw new ForbiddenError("A user with the provided information already exists");
                        }

                        throw new ServiceError(`UserSignUpRetryTransactionService facing issue: ${retryError?.message || "Unknown error"}`);

                    }
                    finally {
                        await retrySession.endSession();
                    }
                }

                // Other duplicate error
                throw new ForbiddenError("A user with the provided information already exists");
            }

            // Log normal transaction error
            logger.error(
                error,
                {
                    serviceName: "UserSignUpTransactionService",
                    business_name: document.business_name,
                    email: document.email,
                }
            );

            const sanitizedError = sanitizeApiError(error);
            
            if (error instanceof AppErrorClass) {
                throw error;
            }

            throw new ServiceError(`UserSignUpTransactionService facing issue`, sanitizedError);

        }
        finally {
            await mongoSession.endSession();
        }

    };


    export default userSignUpTransaction;