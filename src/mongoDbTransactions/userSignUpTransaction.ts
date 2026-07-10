import mongoose, { Types } from "mongoose";
import type { Request, Response } from "express";
import { userDetailsModel as user_details } from "../models/user_details.js";
import { userMetaDetailsModel as user_meta_details } from "../models/user_meta_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, ServiceError, BadRequestError, InvalidRequestBodyError, ForbiddenError } from "../utils/AppErrorClass.js";
import type { userDetailsSchemaTypes } from "../types/schemaTypes.js";
import checkStringBody from "../utils/checkStringBody.js";
import userDetailsValidationSchema from "../validations/userDetailsValidation.js";
import z from "zod";
import type { SafeParseResult } from "../types/zodTypes.js";
import destroySession from "../utils/destroySession.js";
import { genSaltSync, hashSync } from "bcrypt-ts";

const userSignUpTransaction = async (req: Request, res: Response, aesDecryptedBodyData: Record<string, string>) => {
    const mongoSession = await mongoose.startSession();
    try {
        mongoSession.startTransaction();

        // TO HANDLE THE RACE CONDITION TWO CONCURRENT REQUEST ACTING AS THE PRIMARY USER WHEN CREATED

        // Check email present in request body
        const email: string | null = checkStringBody(aesDecryptedBodyData, "email")
        if (!email) {
            throw new InvalidRequestBodyError("Email not present in the request body");
        }

        // Check password present in request body
        const userPassword: string | null = checkStringBody(aesDecryptedBodyData, "password")
        if (!userPassword) {
            throw new InvalidRequestBodyError("Password not present in the request body");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userDetailsValidationSchema>> = userDetailsValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            // return res.status(400).json({
            //     status: "SERVICE_ERROR",
            //     message: "Invalid request body",
            //     // errors: validationResult.error.issues.map(issue => issue.message)
            //     // errors: validationResult.error.issues.map(issue => ({
            //     //     [issue.path.join(".")]: issue.message
            //     // }))
            //     errors: z.flattenError(validationResult.error)
            // });
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        // Check User Exist
        const emailExists = await user_details.exists({
            email: validationResult.data.email
        });
        if (emailExists) {
            const destroySessionResponse = await destroySession(req.session, res);
            throw new ForbiddenError("User already exists");
        }

        // Check primary user (admin) exist
        const primaryUser = await user_details.exists({
            business_name: validationResult.data.business_name,
            program_type: validationResult.data.program_type,
            agent_code: "01",
            subagent_code: "01"
        }).lean();

        // HashPassword
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(userPassword as string, salt);

        // Remove password from aesDecryptedBodyData
        const { password, ...restBody } = validationResult?.data;

        const document = {
            full_name: validationResult.data.full_name,
            business_name: validationResult.data.business_name,
            email: validationResult.data.email,
            phone_number: validationResult.data.phone_number,
            mobile_country_code: validationResult.data.mobile_country_code,
            mobile_country_name: validationResult.data.mobile_country_name,
            gender: validationResult.data.gender,
            date_of_birth: validationResult.data.date_of_birth,

            password: hashedPassword,

            agent_code: "01",
            subagent_code: primaryUser ? "02" : "01",

            business_id: `${validationResult.data.business_name}/01`,
            program_id:
                validationResult.data.program_type === "MASTER"
                    ? "MBMA010"
                    : "VBMA010",

            program_type: validationResult.data.program_type,

            is_admin: primaryUser ? "N" : "Y"
        }

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
        catch (err: any) {
            // Someone else inserted 01/01 before us
            if (err.code === 11000) {
                await mongoSession.abortTransaction();
                mongoSession.endSession();

                // Retry as 01/02
                const retrySession = await mongoose.startSession();

                try {
                    retrySession.startTransaction();

                    const retryDocument = {
                        ...document,
                        subagent_code: "02",
                        is_admin: "N"
                    };

                    const retryInsert = await user_details.create(
                        [retryDocument],
                        {
                            session: retrySession
                        }
                    );

                    await retrySession.commitTransaction();

                    return {
                        status: "SUCCESS",
                        message: "Document inserted successfully",
                        data: retryInsert[0]
                    };

                }
                catch (retryErr) {
                    await retrySession.abortTransaction();

                    const error = retryErr as any;

                    logger.error(
                        error,
                        {
                            serviceName: "UserSignUpRetryTransactionService",
                        }
                    );

                    if (error instanceof AppErrorClass) {
                        throw error;
                    }

                    throw new ServiceError(
                        `UserSignUpRetryTransactionService facing issue: ${error.message
                        }`
                    );
                }
                finally {

                    retrySession.endSession();

                }
            }
            throw err;
        }
    }
    catch (err) {
        await mongoSession.abortTransaction();

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "UserSignUpTransactionService",
            }
        );

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `UserSignUpTransactionService facing issue: ${error.message
            }`
        );
    }
    finally {
        await mongoSession.endSession();
    }

};

export default userSignUpTransaction;