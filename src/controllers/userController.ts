import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { userLoginService, userOnboardingService, userSignUpService } from "../services/userServices.js";
import { getRequestHeaders, getRequestSession } from "../utils/requestContext.js";
import logger from "../utils/logger.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER SIGN UP ------------------------------ \\
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = req.query
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
        aesDecryptedBodyData = transformedPayload;
        // const aesDecryptedQueryData = req.query;
        const userSignUpResponse = await userSignUpService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userSignUpResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "UserSignUp is facing isssue", 400);
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
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("UserSignUpController is facing unknown issue.", error)
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER LOGIN ------------------------------ \\
export const userLogin = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = req.query
        const userLoginServiceResponse = await userLoginService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userLoginServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "UserLogin is facing isssue", 400);
        }

        if (userLoginServiceResponse?.message === "User login successful, verification code sent to email") {
            return res.success("User sign in successfull and verification code sent to the email", userLoginServiceResponse?.data, 200)
        }
        else if (userLoginServiceResponse?.message === "User login successful") {
            return res.success("User sign in successfull.", userLoginServiceResponse?.data, 200)
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
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("UserLoginController is facing issue.", error)
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

export const onboarding = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        
        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }
        const userOnboardingServiceResponse = await userOnboardingService(requestSession, res, aesDecryptedBodyData);

        if (userOnboardingServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "UserLogin is facing isssue", 400);
        }

        return res.success("User onboarded successfull.", userOnboardingServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UserOnbordingController",
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
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("UserOnbordingController is facing issue.", error)
    }
}