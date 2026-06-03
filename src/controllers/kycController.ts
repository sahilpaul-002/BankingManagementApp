import type { Request, Response } from "express";
import type { successResponseJson } from "../types/responseJson.js";
import { getRequestSession } from "../utils/requestContext.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { getKycService, kycVerificationWebhookService, sendKycVerificationMailService, uploadKycService } from "../services/kycServices.js";

// ------------------------------------- FUNCTION TO GET KYC ------------------------------------- \\
export const getKyc = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const getKycServiceResponse = await getKycService(requestSession, res, aesDecryptedBodyData)
        if (getKycServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user kyc details", 400);
        }
        return res.success("User kyc details fetched successfully", getKycServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetKycController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetKycController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO GET KYC ------------------------------------- \\
export const uploadKyc = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const uploadKycServiceResponse = await uploadKycService(req, res, aesDecryptedBodyData)
        if (uploadKycServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to fetch user kyc details", 400);
        }
        return res.success("User kyc details uploaded successfully", uploadKycServiceResponse?.data, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UploadKycController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `UploadKycController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO SENT KYC VERIFICATION MAIL ------------------------------------- \\
export const sendKycVerificationMail = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedBodyData = req.body;

        const requestSession: Request["session"] | undefined = getRequestSession();
        if (!requestSession) {
            throw new UnauthenticatedError("Unauthenticated session");
        }

        const sendKycVerificationMailServiceResponse = await sendKycVerificationMailService(requestSession, res, aesDecryptedBodyData)
        if (sendKycVerificationMailServiceResponse?.status !== "SUCCESS") {
            return res.fail("SERVICE_ERROR", "Failed to sent user kyc verification mail", 400);
        }
        return res.success("User kyc verificaiton mail sent successfully", {}, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SendKycVerificationMailController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `SendKycVerificationMailController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\

// ------------------------------------- FUNCTION TO GET KYC VERIFICATION WEBHOOK ------------------------------------- \\
export const getKycVerificationWebhook = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    try {
        const aesDecryptedQueryData = req.query;

        const sendKycVerificationMailServiceResponse = await kycVerificationWebhookService(res, aesDecryptedQueryData)
        if (sendKycVerificationMailServiceResponse?.status !== "SUCCESS") {
            if (sendKycVerificationMailServiceResponse?.message === "Exipred verification link or RFI requested") {
                return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>KYC Verification Expired</h2>
                    <p>
                        This kyc virification link has been expired or RFI is requested.
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
                throw new ServiceError("Failed to sent kyc verification mail webhook")
            }
        }

        // res.success will not work
        // return res.success("User kyc verificaiton sent successfully", {}, 200)
        if (sendKycVerificationMailServiceResponse?.data === "Kyc verification accepted") {
            return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>KYC Approved Successfully</h2>
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
        else if (sendKycVerificationMailServiceResponse?.data === "Kyc verification rejected") {
            return res.status(200).send(`
            <html>
                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding-top: 100px;
                ">
                    <h2>KYC Rejected Successfully</h2>
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
            serviceName: "GetKycVerificationWebhookController",
            url: req.path,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `GetKycVerificationWebhookController facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\