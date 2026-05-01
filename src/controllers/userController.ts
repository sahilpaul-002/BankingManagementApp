import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { AppErrorClass, BadRequestError, ServiceUnavailableError, UnauthenticatedError } from "../utils/AppErrorClass.js";
import { userLoginService, userSignUpService } from "../services/userServices.js";
import { getRequestHeaders, getRequestSession } from "../utils/requestContext.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER SIGN UP ------------------------------ \\
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
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
            full_name: req.body?.fullName,
            email: req.body?.email,
            password: req.body?.password,

            mobile_country_code: req.body?.dialCode,
            mobile_country_name: req.body?.countryCode,

            phone_number: req.body?.phoneNumber,

            date_of_birth: req.body?.dateOfBirth,

            gender: req.body?.gender?.toUpperCase(),
        };
        const aesDecryptedBodyData = transformedPayload;
        const userSignUpResponse = await userSignUpService(requestSession, res, aesDecryptedBodyData);

        if (userSignUpResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "UserSignUp is facing isssue", 400);
        }

        return res.success("Sign up successfull", userSignUpResponse?.data, 200);
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }

        if (error instanceof Error) {
            throw error;
        }
        throw new ServiceUnavailableError("UserSignUP is facing issue.", error)
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER LOGIN ------------------------------ \\
export const userLogin = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;
        const aesDecryptedQueryData = req.query;
        const userLoginServiceResponse = await userLoginService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userLoginServiceResponse?.status !== "SUCCESS") {
            res.fail("SERVICE_ERROR", "UserLogin is facing isssue", 400);
        }

        return res.success("Sign in successfull", userLoginServiceResponse?.data, 200)
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }

        if (error instanceof Error) {
            throw error;
        }
        throw new ServiceUnavailableError("UserLogin is facing issue.", error)
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

export const check = async (req: any, res: any) => {
    return res.status(200).json({ status: "SUCCESS", message: "User login successfull" });
}