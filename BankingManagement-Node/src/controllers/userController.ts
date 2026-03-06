import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { asymmetricDecryptionMsg } from "../utils/asymmetricEncryptionDecryption.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";
import { userDetailsModel as user_details } from '../models/user_details.js';
import errorHandler from "../utils/errorHandler.js";
import destroySession from "../utils/destroySession.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import mongoose from "mongoose";
import type { userDetailsSchema } from "../types/schemaTypes.js";
import userDetailsValidationSchema from "../validations/userDetailsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import userLoginValidationSchema from "../validations/userLoginValidation.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// FUNCTION TO PERFORM USER SIGN UP
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    // Get request header "from_portal" to check the sorce the api call
    const fromPortal: string = req?.headers["from-portal"] as string;

    let reqBody: any = null;
    // Check if the api call is not from portal
    if (fromPortal === "true") {
        // Get encrypted payload
        const encryptedPayload: string = req?.body
        // Decrypt request body
        const decryptionMsgResponse = asymmetricDecryptionMsg(req, encryptedPayload);

        if (decryptionMsgResponse && decryptionMsgResponse.status.toUpperCase() === "SUCCESS") {
            const successResponse: decryptionSuccessJson = decryptionMsgResponse as decryptionSuccessJson;
            reqBody = JSON.parse(successResponse?.decryptedText);
            // console.log(reqBody)
        }
        else if (decryptionMsgResponse && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse.status.toUpperCase())) {
            const errorResponse: decryptionFailedJson = decryptionMsgResponse as decryptionFailedJson;
            if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                return res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthorised Access: Private key not found in session." })
            }
            else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                return res.status(400).json({ status: "ERROR", message: "Asymmetric decryption service is not working." })
            }
        }
        else {
            return res.status(400).json({ status: "SERVICE_UNAVAILABLE", message: "ASYMMETRIC DECRYPTION SERVICE UNAVAILABLE" })
        }
    }
    else {
        reqBody = req.body;
    }

    try {
        // Check email present in request body
        if (!reqBody?.email) {
            return res.status(401).json({ status: "BAD_REQUEST", message: "Email not present in the request body" });
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userDetailsValidationSchema>> = userDetailsValidationSchema.safeParse(reqBody);
        if (!validationResult.success) {
            return res.status(400).json({
                status: "ERROR",
                message: "Invalid request body",
                // errors: validationResult.error.issues.map(issue => issue.message)
                // errors: validationResult.error.issues.map(issue => ({
                //     [issue.path.join(".")]: issue.message
                // }))
                errors: z.flattenError(validationResult.error)
            });
        }

        // Get user from DB
        const checkUserExistInDB = async (req: Request): Promise<boolean | null> => {
            const userExistResponse: userDetailsSchema | null = await user_details.findOne({ email: reqBody.email });
            return userExistResponse !== null;
        }
        const userExistance: boolean | null = await checkUserExistInDB(req);

        // Check user exist in DB
        if (userExistance) {
            const destroySessionResponse = await destroySession(req, res);
            return res.status(400).json({ status: "FORBIDDEN", message: "User already exists" });
        }

        // HashPassword
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(reqBody.password, salt);

        // Remove password from reqBody
        const { password, ...restBody } = reqBody;

        // Format document by adding the agent_code and subagent_code from session
        const document: object = {
            ...restBody,
            password: hashedPassword,
            agent_code: req.session?.sessiondata?.agentCode,
            subagent_code: req.session?.sessiondata?.subAgentCode
        };

        // Insert document in collection
        const insertedDocument = await user_details.create(document);

        // console.log("Document inserted: ", insertedDocument);
        return res.status(200).json({ status: "SUCCESS", message: "Document inserted successfully", data: insertedDocument });
    }
    catch (error) {
        errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "USER SIGN UP SERVICE FACING ISSUE.");
    }
}

// FUNCTION TO PERFORM USER LOGIN
export const userLogin = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    // Get request header "from_portal" to check the sorce the api call
    const fromPortal: string = req?.headers["from-portal"] as string;

    let reqBody: any = null;
    // Check if the api call is not from portal
    if (fromPortal === "true") {
        // Get encrypted payload
        const encryptedPayload: string = req?.body
        // Decrypt request body
        const decryptionMsgResponse = asymmetricDecryptionMsg(req, encryptedPayload);

        if (decryptionMsgResponse && decryptionMsgResponse.status.toUpperCase() === "SUCCESS") {
            const successResponse: decryptionSuccessJson = decryptionMsgResponse as decryptionSuccessJson;
            reqBody = JSON.parse(successResponse?.decryptedText);
            // console.log(reqBody)
        }
        else if (decryptionMsgResponse && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse.status.toUpperCase())) {
            const errorResponse: decryptionFailedJson = decryptionMsgResponse as decryptionFailedJson;
            if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                return res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthorised Access: Private key not found in session." })
            }
            else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                return res.status(400).json({ status: "ERROR", message: "Asymmetric decryption service is not working." })
            }
        }
        else {
            return res.status(400).json({ status: "SERVICE_UNAVAILABLE", message: "ASYMMETRIC DECRYPTION SERVICE UNAVAILABLE" })
        }
    }
    else {
        reqBody = req.body;
    }

    try {
        // Check email present in request body
        if (!reqBody?.email) {
            return res.status(401).json({ status: "BAD_REQUEST", message: "Email not present in the request body" });
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userLoginValidationSchema>> = userLoginValidationSchema.safeParse(reqBody);
        if (!validationResult.success) {
            return res.status(400).json({
                status: "ERROR",
                message: "Invalid request body",
                // errors: validationResult.error.issues.map(issue => issue.message)
                // errors: validationResult.error.issues.map(issue => ({
                //     [issue.path.join(".")]: issue.message
                // }))
                errors: z.flattenError(validationResult.error)
            });
        }

        // Get user from DB
        const checkUserExistInDB = async (req: Request): Promise<userDetailsSchema | null> => {
            const userExistResponse: userDetailsSchema | null = await user_details.findOne({ email: reqBody.email });
            return userExistResponse;
        }
        const userDetails: userDetailsSchema | null = await checkUserExistInDB(req);

        // Check user exist in DB
        if (!userDetails) {
            const destroySessionResponse = await destroySession(req, res);
            return res.status(400).json({ status: "FORBIDDEN", message: "User does not exist" });
        }

        // Check user input password validity
        const isPasswordValid = compareSync(reqBody.password, userDetails?.password);
        if (!isPasswordValid) {
            const destroySessionResponse = await destroySession(req, res);
            return res.status(400).json({ status: "FORBIDDEN", message: "Invalid credentials" });
        }

        return res.status(200).json({ status: "SUCCESS", message: "User login successfull", data: userDetails });
    }
    catch (error) {
        errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "USER SIGN IN SERVICE FACING ISSUE.");
    }
}