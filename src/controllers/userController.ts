import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { asymmetricDecryptionMsg } from "../utils/asymmetricEncryptionDecryption.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";
import { AppErrorClass, BadRequestError, ServiceError, ServiceUnavailableError, UnauthenticatedError } from "../utils/AppErrorClass.js";
import { symmetricDecryptionMsg, symmetricEncryptionMsg } from "../utils/symmetricEncryptionDecryption.js";
import { userLoginService, userSignUpService } from "../services/userServices.js";
import type { ParsedQs } from "qs";
import { getRequestHeaders, getRequestSession } from "../utils/requestContext.js";
import type { sessionItemsTypes } from "../types/sessionTypes.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER SIGN UP ------------------------------ \\
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    let aesDecryptedBodyData: Record<string, string> | undefined = undefined;
    let aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined = undefined;
    let ivHex: string | undefined
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };

            // RSA Asummetric payload decryption
            try {
                // Get encrypted request body payload1
                const encryptedRequestBodyPayload1: string = req?.body?.encryptedRequestBodyPayload1

                // Decrypt encryptedRequestBodyPayload1
                const decryptionMsgResponse1 = asymmetricDecryptionMsg(req, encryptedRequestBodyPayload1);
                if (decryptionMsgResponse1 && decryptionMsgResponse1.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse1 as decryptionSuccessJson;
                    rsaDecryptedData = JSON.parse(successResponse?.decryptedText);
                    ivHex = rsaDecryptedData.ivHex
                    // console.log(rsaDecryptedData)
                }
                else if (decryptionMsgResponse1 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse1.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse1 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Asymmetric decryption error - cipher text not found.");
                    }
                }
                else {
                    throw new ServiceError("Asymmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new ServiceUnavailableError("Asymmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted request body payload2
                const encryptedRequestBodyPayload2: string = req?.body?.encryptedRequestBodyPayload2

                // Decrypt encryptedRequestBodyPayload2 
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedRequestBodyPayload2, ivHex);
                if (decryptionMsgResponse2 && decryptionMsgResponse2.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse2 as decryptionSuccessJson;
                    aesDecryptedBodyData = JSON.parse(successResponse?.decryptedText);
                    const transformedPayload = {
                        full_name: aesDecryptedBodyData?.fullName,
                        email: aesDecryptedBodyData?.email,
                        password: aesDecryptedBodyData?.password,

                        mobile_country_code: aesDecryptedBodyData?.dialCode,
                        mobile_country_name: aesDecryptedBodyData?.countryCode,

                        phone_number: aesDecryptedBodyData?.phoneNumber,

                        date_of_birth: aesDecryptedBodyData?.dateOfBirth,

                        gender: aesDecryptedBodyData?.gender?.toUpperCase(),
                    };
                    aesDecryptedBodyData = transformedPayload as Record<string, string>;
                    // console.log(aesDecryptedBodyData)
                }
                else if (decryptionMsgResponse2 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse2.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse2 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new ServiceError("Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted query params payload2
                const encryptedQueryPayload1: string = req?.query?.encryptedQueryParam1 as string

                // Decrypt encryptedPayload1
                const decryptionMsgResponse3 = symmetricDecryptionMsg(req, encryptedQueryPayload1, ivHex);
                if (decryptionMsgResponse3 && decryptionMsgResponse3.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse3 as decryptionSuccessJson;
                    aesDecryptedQueryData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedQueryData)
                }
                else if (decryptionMsgResponse3 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse3.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse3 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new ServiceError("Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.");
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
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }
        const requestHeaders: Request["headers"] | undefined = getRequestHeaders();
        if (!requestHeaders) {
            throw new BadRequestError("Bad request - headers not found in request");
        }
        const userSignUpResponse = await userSignUpService(requestSession, res, aesDecryptedBodyData);

        if (userSignUpResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "getDnsConfigService facing isssue", 400);
        }

        // Encrypt response using AES
        const responseObj = userSignUpResponse?.data;
        const symmetricEncryptionMsgResponse = symmetricEncryptionMsg(req, responseObj, ivHex as string);
        if (symmetricEncryptionMsgResponse?.status !== "SUCCESS") {
            throw new ServiceUnavailableError("Symmetric encryption service unavailbale")
        }

        return res.success("Sign up successfull", symmetricEncryptionMsgResponse?.ciphertextHex, 200);
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
    let ivHex: string | undefined
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };

            // RSA Asummetric payload decryption
            try {
                // Get encrypted request body payload1
                const encryptedRequestBodyPayload1: string = req?.body?.encryptedRequestBodyPayload1

                // Decrypt encryptedRequestBodyPayload1
                const decryptionMsgResponse1 = asymmetricDecryptionMsg(req, encryptedRequestBodyPayload1);
                if (decryptionMsgResponse1 && decryptionMsgResponse1.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse1 as decryptionSuccessJson;
                    rsaDecryptedData = JSON.parse(successResponse?.decryptedText);
                    ivHex = rsaDecryptedData.ivHex
                    // console.log(rsaDecryptedData)
                }
                else if (decryptionMsgResponse1 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse1.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse1 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Asymmetric decryption error - cipher text not found.");
                    }
                }
                else {
                    throw new ServiceError("Asymmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new ServiceUnavailableError("Asymmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted request body payload2
                const encryptedRequestBodyPayload2: string = req?.body?.encryptedRequestBodyPayload2

                // Decrypt encryptedRequestBodyPayload2 
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedRequestBodyPayload2, ivHex);
                if (decryptionMsgResponse2 && decryptionMsgResponse2.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse2 as decryptionSuccessJson;
                    aesDecryptedBodyData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedBodyData)
                }
                else if (decryptionMsgResponse2 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse2.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse2 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new ServiceError("Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.");
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted query params payload2
                const encryptedQueryPayload1: string = req?.query?.encryptedQueryParam1 as string

                // Decrypt encryptedPayload1
                const decryptionMsgResponse3 = symmetricDecryptionMsg(req, encryptedQueryPayload1, ivHex);
                if (decryptionMsgResponse3 && decryptionMsgResponse3.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse3 as decryptionSuccessJson;
                    aesDecryptedQueryData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedQueryData)
                }
                else if (decryptionMsgResponse3 && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse3.status.toUpperCase())) {
                    const errorResponse: decryptionFailedJson = decryptionMsgResponse3 as decryptionFailedJson;
                    if (errorResponse?.message?.includes("Symmetric encryption key not found in the session")) {
                        throw new UnauthenticatedError("Unauthenticated Access: Private key not found in session");
                    }
                    else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - cipher text not found.");
                    }
                    else if (errorResponse?.message?.includes("IvHex not found in the function parameter")) {
                        throw new ServiceError("Symmetric decryption error - ivHex not found.");
                    }
                }
                else {
                    throw new ServiceError("Symmetric decryption service unavailable");
                }
            }
            catch (error) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.");
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
        throw new Error("UserSignIn-requestPayload decryption is facing issue.")
    }
    try {
        const userLoginServiceResponse = await userLoginService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userLoginServiceResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "getDnsConfigService facing isssue", 400);
        }

        // Encrypt response using AES
        const responseObj = userLoginServiceResponse?.data;
        const symmetricEncryptionMsgResponse = symmetricEncryptionMsg(req, responseObj, ivHex as string);
        if (symmetricEncryptionMsgResponse?.status !== "SUCCESS") {
            throw new ServiceUnavailableError("Symmetric encryption service unavailbale")
        }

        return res.success("Sign in successfull", symmetricEncryptionMsgResponse?.ciphertextHex, 200);
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