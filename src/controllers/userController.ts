import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { asymmetricDecryptionMsg } from "../utils/asymmetricEncryptionDecryption.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";
import { userDetailsModel as user_details } from '../models/user_details.js';
import destroySession from "../utils/destroySession.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { userDetailsSchemaTypes, userMetaDetailsSchemaTypes } from "../types/schemaTypes.js";
import userDetailsValidationSchema from "../validations/userDetailsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import { AppErrorClass } from "../utils/AppErrorClass.js";
import { symmetricDecryptionMsg } from "../utils/symmetricEncryptionDecryption.js";
import { userLoginService, userSignUpService } from "../services/userServices.js";
import type { ParsedQs } from "qs";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER SIGN UP ------------------------------ \\
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    let aesDecryptedBodyData: Record<string, string> | undefined = undefined;
    let aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined = undefined;
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };
            let ivHex: string | undefined
            let aesDecryptedData: any

            // RSA Asummetric payload decryption
            try {
                // Get encrypted payload1
                const encryptedPayload1: string = req?.body?.encryptedPayload1

                // Decrypt encryptedPayload1
                const decryptionMsgResponse1 = asymmetricDecryptionMsg(req, encryptedPayload1);
                if (decryptionMsgResponse1 && decryptionMsgResponse1.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse1 as decryptionSuccessJson;
                    rsaDecryptedData = JSON.parse(successResponse?.decryptedText);
                    ivHex = rsaDecryptedData.ivHex
                    // console.log(rsaDecryptedData)
                }
                else if (decryptionMsgResponse1 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse1.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse1 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                        throw new AppErrorClass(400, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Asymmetric decryption error - cipher text not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Asymmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Asymmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new AppErrorClass(400, "ERROR", "IV not generated from asymmetric decryption");
                }

                // Get encrypted payload2
                const encryptedPayload2: string = req?.body?.encryptedPayload2

                // Decrypt encryptedPayload1
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedPayload2, ivHex);
                if (decryptionMsgResponse2 && decryptionMsgResponse2.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse2 as decryptionSuccessJson;
                    aesDecryptedData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedData)
                }
                else if (decryptionMsgResponse2 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse2.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse2 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new AppErrorClass(400, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Symmetric decryption service is not working.");
            }
        }
        else {
            aesDecryptedBodyData = req.body;
            aesDecryptedQueryData = req.query
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignUP-requestPayload decryption is facing issue.")
    }

    try {
        const userSignUpResponse = await userSignUpService(req, res, aesDecryptedBodyData);

        if (userSignUpResponse?.status !== "SUCCESS") {
            res.fail("ERROR", "getDnsConfigService facing isssue", 400);
        }
        return res.success("User login successfull", userSignUpResponse?.data, 200);
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignUP is facing issue.")
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER LOGIN ------------------------------ \\
export const userLogin = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    let aesDecryptedBodyData: Record<string, string> | undefined = undefined;
    let aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined = undefined;
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };
            let ivHex: string | undefined

            // RSA Asummetric payload decryption
            try {
                // Get encrypted payload1
                const encryptedPayload1: string = req?.body?.encryptedPayload1

                // Decrypt encryptedPayload1
                const decryptionMsgResponse1 = asymmetricDecryptionMsg(req, encryptedPayload1);
                if (decryptionMsgResponse1 && decryptionMsgResponse1.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse1 as decryptionSuccessJson;
                    rsaDecryptedData = JSON.parse(successResponse?.decryptedText);
                    ivHex = rsaDecryptedData.ivHex
                    // console.log(rsaDecryptedData)
                }
                else if (decryptionMsgResponse1 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse1.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse1 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                        throw new AppErrorClass(400, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Asymmetric decryption error - cipher text not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Asymmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Asymmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new AppErrorClass(400, "ERROR", "IV not generated from asymmetric decryption");
                }

                // Get encrypted payload2
                const encryptedPayload2: string = req?.body?.encryptedPayload2

                // Decrypt encryptedPayload1
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedPayload2, ivHex);
                if (decryptionMsgResponse2 && decryptionMsgResponse2.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse2 as decryptionSuccessJson;
                    aesDecryptedBodyData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedBodyData)
                }
                else if (decryptionMsgResponse2 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse2.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse2 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new AppErrorClass(400, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Symmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new AppErrorClass(400, "ERROR", "IV not generated from asymmetric decryption");
                }

                // Get encrypted payload2
                const encryptedQueryPayload: string = req?.query?.encryptedPayload as string

                // Decrypt encryptedPayload1
                const decryptionMsgResponse3 = symmetricDecryptionMsg(req, encryptedQueryPayload, ivHex);
                if (decryptionMsgResponse3 && decryptionMsgResponse3.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse3 as decryptionSuccessJson;
                    aesDecryptedQueryData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedQueryData)
                }
                else if (decryptionMsgResponse3 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse3.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse3 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new AppErrorClass(400, "UNAUTHENTICATED", "Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new AppErrorClass(400, "ERROR", "Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new AppErrorClass(400, "ERROR", "Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new AppErrorClass(400, "SERVICE_UNAVAILABLE", "Symmetric decryption service is not working.");
            }
        }
        else {
            aesDecryptedBodyData = req.body;
            aesDecryptedQueryData = req.query
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserSignUP-requestPayload decryption is facing issue.")
    }
    try {
        const userLoginServiceResponse = await userLoginService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userLoginServiceResponse?.status !== "SUCCESS") {
            res.fail("ERROR", "getDnsConfigService facing isssue", 400);
        }
        return res.success("User login successfull", userLoginServiceResponse?.data, 200);
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("UserLogin is facing issue.")
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

export const check = async (req: any, res: any) => {
    return res.status(200).json({ status: "SUCCESS", message: "User login successfull" });
}