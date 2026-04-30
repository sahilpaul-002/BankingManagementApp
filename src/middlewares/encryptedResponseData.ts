import type { Request, Response, NextFunction } from 'express';
import type { failedResponseJson, successResponseJson } from '../types/responseJson.js';
import { skipEncryptionDecryptionRoutes } from '../utils/skipEncryptionDecryptionRoutes.js';
import { symmetricEncryptionMsg } from '../utils/symmetricEncryptionDecryption.js';
import { ServiceError } from '../utils/AppErrorClass.js';

const encryptResponseData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Get request header "from_portal" to check the sorce the api call
    const fromPortal: string = (req?.headers["from-portal"] ?? "false") as string;
    // Check if the api call is not from portal
    if (fromPortal === "false") {
        return next();
    }

    // Preserve original with correct typing
    const originalJson = res.json.bind(res) as typeof res.json;

    // Override with generic signature
    // res.json = function <T>(body: ApiResponse<T>): Response<ApiResponse<T>> {
    res.json = function (body: successResponseJson): Response<successResponseJson> {
        try {
            // Skip Encryption For Specified Routes
            if (skipEncryptionDecryptionRoutes(req)) {
                return originalJson.call(this, body);
            }

            const ivHex = (req as Request & { __ivHex?: string }).__ivHex;

            // Fail-safe
            if (!ivHex) {
                return originalJson(body);
            }

            const responseData = body?.data;

            // Nothing to encrypt
            if (responseData === undefined || responseData === null) {
                return originalJson(body);
            }

            const encryptRes = symmetricEncryptionMsg(req, responseData, ivHex);

            if (encryptRes?.status !== "SUCCESS") {
                throw new ServiceError("AES response encryption service caused error");
            }

            const newBody: successResponseJson = {
                ...body,
                data: encryptRes.ciphertextHex
            };

            return originalJson(newBody);

        } catch (err) {
            console.error("Encryption error:", err);

            // fallback (still typed)
            return originalJson(body);
        }
    };

    next();
};

export default encryptResponseData;