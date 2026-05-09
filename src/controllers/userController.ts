import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { userLoginService, userSignUpService } from "../services/userServices.js";
import { getRequestHeaders, getRequestSession } from "../utils/requestContext.js";
import logger from "../utils/logger.js";
import { sendEmailService } from "../services/twoFaService.js";
import { asymmetricDecryptionMsg } from "../utils/asymmetricEncryptionDecryption.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";
import { symmetricDecryptionMsg } from "../utils/symmetricEncryptionDecryption.js";
import generateEmailTemplate from "../utils/generateEmailTemplate.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER SIGN UP ------------------------------ \\
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    let aesDecryptedBodyData: any = null;
    let aesDecryptedQueryData: any = null;
    let ivHex: string | undefined
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };

            // RSA Asummetric payload decryption
            try {
                // Get encrypted payload1
                const encryptedPayload1: string = req?.body?.encryptedPayload1 as string

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
            catch (err) {
                throw new ServiceUnavailableError("Asymmetric decryption service is not working.", err);
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted payload2
                const encryptedPayload2: string = req?.body?.encryptedPayload2 as string

                // Decrypt encryptedPayload2
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedPayload2, ivHex);
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

                // Get encrypted query payload2
                const encryptedQueryPayload2: string = req?.query?.encryptedQueryPayload2 as string

                // Decrypt encrypted query payload2
                const decryptionMsgResponse3 = symmetricDecryptionMsg(req, encryptedQueryPayload2, ivHex);
                if (decryptionMsgResponse3 && decryptionMsgResponse3.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse3 as decryptionSuccessJson;
                    aesDecryptedQueryData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedBodyData)
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
            catch (err) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.", err);
            }
        }
        else {
            aesDecryptedBodyData = req.body;
            aesDecryptedQueryData = req.query;
        }
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetDnsConfigRequestPayloadDecryption",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetDnsConfigRequestPayloadDecryption service is facing unknown issue.", err);
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
        // Transform payload
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
        // const transformedPayload = {
        //     full_name: req.body?.fullName,
        //     email: req.body?.email,
        //     password: req.body?.password,

        //     mobile_country_code: req.body?.dialCode,
        //     mobile_country_name: req.body?.countryCode,

        //     phone_number: req.body?.phoneNumber,

        //     date_of_birth: req.body?.dateOfBirth,

        //     gender: req.body?.gender?.toUpperCase(),
        // };
        // const aesDecryptedBodyData = transformedPayload;
        aesDecryptedBodyData = transformedPayload;
        // const aesDecryptedQueryData = req.query;
        const userSignUpResponse = await userSignUpService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userSignUpResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "UserSignUp is facing isssue", 400);
        }

        return res.success("Sign up successfull", userSignUpResponse?.data, 200);
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserSignUpController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("UserSignUpController is facing unknown issue.", error)
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER LOGIN ------------------------------ \\
export const userLogin = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    let aesDecryptedBodyData: any = null;
    let aesDecryptedQueryData: any = null;
    let ivHex: string | undefined
    try {
        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = req?.headers["from-portal"] as string;

        // Check if the api call is not from portal
        if (fromPortal === "true") {
            let rsaDecryptedData: { ivHex: string };

            // RSA Asummetric payload decryption
            try {
                // Get encrypted payload1
                const encryptedPayload1: string = req?.body?.encryptedPayload1 as string

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
            catch (err) {
                throw new ServiceUnavailableError("Asymmetric decryption service is not working.", err);
            }

            // AES Symmetric payload decryption
            try {
                if (!ivHex) {
                    throw new ServiceError("IV not generated from asymmetric decryption");
                }

                // Get encrypted payload2
                const encryptedPayload2: string = req?.body?.encryptedPayload2 as string

                // Decrypt encryptedPayload2
                const decryptionMsgResponse2 = symmetricDecryptionMsg(req, encryptedPayload2, ivHex);
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

                // Get encrypted query payload2
                const encryptedQueryPayload2: string = req?.query?.encryptedQueryPayload2 as string

                // Decrypt encrypted query payload2
                const decryptionMsgResponse3 = symmetricDecryptionMsg(req, encryptedQueryPayload2, ivHex);
                if (decryptionMsgResponse3 && decryptionMsgResponse3.status.toUpperCase() === "SUCCESS") {
                    const successResponse: decryptionSuccessJson = decryptionMsgResponse3 as decryptionSuccessJson;
                    aesDecryptedQueryData = JSON.parse(successResponse?.decryptedText);
                    // console.log(aesDecryptedBodyData)
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
            catch (err) {
                throw new ServiceUnavailableError("Symmetric decryption service is not working.", err);
            }
        }
        else {
            aesDecryptedBodyData = req.body;
            aesDecryptedQueryData = req.query;
        }
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetDnsConfigRequestPayloadDecryption",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetDnsConfigRequestPayloadDecryption service is facing unknown issue.", err);
    }
    try {
        const userLoginServiceResponse = await userLoginService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userLoginServiceResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "UserLogin is facing isssue", 400);
        }

        if (userLoginServiceResponse?.message === "User login successful, verification code sent to email") {
            return res.success("Sign in successfull and verification code sent to the email", userLoginServiceResponse?.data, 200)
        }
        else {
            return res.success("User login successfull, but failed to send verification code", userLoginServiceResponse?.data, 200)
        }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserLoginController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("UserLoginController is facing issue.", error)
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

export const check = async (req: any, res: any) => {
    return res.status(200).json({ status: "SUCCESS", message: "User login successfull" });
}