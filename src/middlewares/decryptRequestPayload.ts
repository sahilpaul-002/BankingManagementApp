import type { Request, Response, NextFunction } from 'express';
import { asymmetricDecryptionMsg } from '../utils/asymmetricEncryptionDecryption.js';
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from '../utils/AppErrorClass.js';
import { symmetricDecryptionMsg } from '../utils/symmetricEncryptionDecryption.js';
import logger from '../utils/logger.js';
import { getDnsConfigService } from '../services/configServices.js';
import { skipEncryptionDecryptionRoutes } from '../utils/skipEncryptionDecryptionRoutes.js';

const decryptRequestPayload = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Skip Decryption For Specified Routes
        if (skipEncryptionDecryptionRoutes(req)) {
            return next();
        }

        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = (req?.headers["from-portal"] ?? "false") as string;
        // Check if the api call is not from portal
        if (fromPortal === "false") {
            return next();
        }

        let ivHex: string | undefined;

        // EXTRACT RSA PAYLOAD (IV)

        const rsaPayload =
            req.body?.encryptedPayload1 ||
            req.query?.encryptedQueryPayload1;

        if (!rsaPayload) {
            return next(); // no encryption present
        }

        const rsaRes = asymmetricDecryptionMsg(req, rsaPayload as string);

        if (rsaRes?.status !== "SUCCESS") {
            if (rsaRes?.status === "NOT_FOUND") {
                throw new UnauthenticatedError("Unauthenticated session")
            }
            else {
                throw new ServiceError("RSA decryption service caused error");
            }
        }

        const rsaData = JSON.parse(rsaRes.decryptedText);
        ivHex = rsaData.ivHex;

        if (!ivHex) {
            throw new ServiceError("RSA decryption service caused error - IV missing from RSA payload");
        }

        // DECRYPT BODY (if present)
        if (req.body?.encryptedPayload2) {
            const aesRes = symmetricDecryptionMsg(
                req,
                req.body.encryptedPayload2 as string,
                ivHex
            );

            if (aesRes?.status !== "SUCCESS") {
                if (aesRes?.status === "NOT_FOUND") {
                    throw new UnauthenticatedError("Unauthenticated session")
                }
                else {
                    throw new ServiceError("AES decryption service caused error");
                }
            }

            req.body = JSON.parse(aesRes.decryptedText);
        }

        // DECRYPT QUERY PARAMS (if present)

        if (req.query?.encryptedQueryPayload2) {
            const aesRes = symmetricDecryptionMsg(
                req,
                req.query.encryptedQueryPayload2 as string,
                ivHex
            );

            if (aesRes?.status !== "SUCCESS") {
                throw new ServiceError("AES query decryption service caused error");
            }

            // req.query = JSON.parse(aesRes.decryptedText);
            const decryptedQuery = JSON.parse(aesRes.decryptedText);

            Object.assign(req.query, decryptedQuery);
        }

        // STORE IV FOR RESPONSE

        (req as any).__ivHex = ivHex;

        next();
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "DecryptRequestPayloadMiddleware",
            // url: req.path,
            // method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `DecryptRequestPayloadMiddleware facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
};

export default decryptRequestPayload;