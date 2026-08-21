import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestQueryError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import { getUserFundingAccountsBalancesService, prefundUserCryptoFundingAccountService, prefundUserFiatFundingAccountService, sendBankVerificationMailService, userBankVerificationWebhookService, userLoginService, userOnboardingService, userSignUpService } from "../services/userServices.js";
import { getRequestHeaders, getRequestSession } from "../utils/requestContext.js";
import logger from "../utils/logger.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER SIGN UP ------------------------------ \\
export const userSignUp = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        let aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;
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

            business_name: aesDecryptedBodyData?.businessName,
            business_type: aesDecryptedBodyData?.businessType,

            program_type: aesDecryptedBodyData?.programType,

            email: aesDecryptedBodyData?.email,
            password: aesDecryptedBodyData?.password,

            mobile_country_code: aesDecryptedBodyData?.dialCode,
            mobile_country_name: aesDecryptedBodyData?.countryCode,

            phone_number: aesDecryptedBodyData?.phoneNumber,

            date_of_birth: aesDecryptedBodyData?.dateOfBirth,

            gender: aesDecryptedBodyData?.gender?.toUpperCase(),
        };
        aesDecryptedBodyData = transformedPayload;
        const userSignUpResponse = await userSignUpService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userSignUpResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "UserSignUp is facing issue", 400);
        }

        return res.success("Sign up successfull", {}, 200);
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
            throw error
        }
        throw new ServiceError(
            `UserSignUpController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------ FUNCTION TO PERFORM USER LOGIN ------------------------------ \\
export const userLogin = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query
        const userLoginServiceResponse = await userLoginService(req, res, aesDecryptedBodyData, aesDecryptedQueryData);

        if (userLoginServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "UserLogin is facing issue", 400);
        }

        if (userLoginServiceResponse?.message?.includes("verification code sent to email")) {
            return res.success("User login successfull, verification code sent to the email", userLoginServiceResponse?.data, 200)
        }
        else if (userLoginServiceResponse?.message?.includes("failed to send verification code")) {
            return res.success("User login successfull, but failed to send verification code.", userLoginServiceResponse?.data, 200)
        }
        else if (userLoginServiceResponse?.message?.includes("2fa not enabled")) {
            return res.success("User login successfull, 2fa not enabled.", userLoginServiceResponse?.data, 200)
        }
        else if (userLoginServiceResponse?.message?.includes("2fa enabled")) {
            return res.success("User login successful, 2fa enabled.", userLoginServiceResponse?.data, 200)
        }
        else {
            return res.fail("SERVICE_ERROR", "UserLogin is facing issue", 400);
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
            throw error
        }
        throw new ServiceError(
            `UserLoginController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------------- FUNCTION TO ONBOARD USER ------------------------------------- \\
export const onboarding = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }
        const userOnboardingServiceResponse = await userOnboardingService(requestSession, aesDecryptedQueryData, aesDecryptedBodyData);
        if (userOnboardingServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "User onboarding is facing issue", 400);
        }

        return res.success(userOnboardingServiceResponse?.message, userOnboardingServiceResponse?.data, 200)
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
            throw error
        }
        throw new ServiceError(
            `UserOnbordingController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\

// ------------------------------------- FUNCTION TO SENT BANK VERIFICATION MAIL ------------------------------------- \\
export const sendBankVerificationMail = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const sendBankVerificationMailServiceResponse = await sendBankVerificationMailService(requestSession, aesDecryptedBodyData)
        if (sendBankVerificationMailServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to sent user bank account verification mail", 400);
        }
        return res.success("User bank account verificaiton mail sent successfully", {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SendBankVerificationMailController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `SendBankVerificationMailController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO GET USER BANK VERIFICATION WEBHOOK ------------------------------------- \\
export const getUserBankVerificationWebhook = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;

        const getUserBankVerificationMailServiceResponse = await userBankVerificationWebhookService(aesDecryptedQueryData)
        if (getUserBankVerificationMailServiceResponse?.status !== "SUCCESS") {
            if (getUserBankVerificationMailServiceResponse?.message === "Exipred verification link") {
                return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>Bank Account Verification Expired</h2>
                    <p>
                        This user bank account verification link has been expired.
                    </p>
                    <p>
                        You can now close this tab.
                    </p>
                </body>
            </html>
        `
                );
            }
            else {
                throw new ServiceError("Failed to sent user bank account verification mail webhook")
            }
        }

        // res.success will not work
        // return res.success("User kyc verificaiton sent successfully", {}, 200)
        if (getUserBankVerificationMailServiceResponse?.data === "User bank account verification accepted") {
            return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>Bank Account Approved Successfully</h2>
                    <p>
                        The verification request has been processed.
                    </p>
                    <p>
                        You can now close this tab.
                    </p>
                </body>
            </html>
        `
            );
        }
        else if (getUserBankVerificationMailServiceResponse?.data === "User bank account verification rejected") {
            return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>Bank Account Rejected Successfully</h2>
                    <p>
                        The verification request has been processed.
                    </p>
                    <p>
                        You can now close this tab.
                    </p>
                </body>
            </html>
        `
            );
        }
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetUserBankAccountVerificationWebhookController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetUserBankAccountVerificationWebhookController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- FUNCTION PREFUND FIAT FUNDING ACCOUNT ------------------------------------- \\
export const prefundUserFiatFundingAccount = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;

        const prefundUserFiatFundingAccountServiceResponse = await prefundUserFiatFundingAccountService(aesDecryptedBodyData)
        if (prefundUserFiatFundingAccountServiceResponse?.status !== "SUCCESS") {
            res.status(400).json({
                message: "Failed to prefund user fiat funding account"
            })
        }

        return res.status(200).json({
            message: "User fiat funding account prefund loaded successfully",
            data: prefundUserFiatFundingAccountServiceResponse?.data ?? {}
        })
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "PrefundUserFiatFundingAccountController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `PrefundUserFiatFundingAccountController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- FUNCTION PREFUND CRYPTO FUNDING ACCOUNT ------------------------------------- \\
export const prefundUserCryptoFundingAccount = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;

        const prefundUserCryptoFundingAccountServiceResponse = await prefundUserCryptoFundingAccountService(aesDecryptedBodyData)
        if (prefundUserCryptoFundingAccountServiceResponse?.status !== "SUCCESS") {
            res.status(400).json({
                message: "Failed to prefund user crypto funding account"
            })
        }

        return res.status(200).json({
            message: "User crypto funding account prefund loaded successfully",
            data: prefundUserCryptoFundingAccountServiceResponse?.data ?? {}
        })
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "PrefundUserCryptoFundingAccountController",
            url: req.path,
            method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `PrefundUserCryptoFundingAccountController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- GET USER FUNDING ACCOUNT BALANCE ------------------------------------- \\
export const getUserFundingAccountsBalances = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;
        const aesDecryptedQueryData = (req as any).reqDecryptedQuery ?? req.query;

        const getUserFundingAccountsBalancesServiceResponse = await getUserFundingAccountsBalancesService(aesDecryptedQueryData);
        if (getUserFundingAccountsBalancesServiceResponse?.status !== "SUCCESS") {
            return res.status(400).json({
                message: "Failed to fetch funding account balance"
            });
        }

        return res.status(200).json({message: "Funding account balance fetched successfully", data: getUserFundingAccountsBalancesServiceResponse?.data ?? {}});
    }
    catch (err) {
        const error = err as any;

        const errorStatus =
            error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetUserFundingAccountsBalancesController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `GetUserFundingAccountsBalancesController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
};
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\