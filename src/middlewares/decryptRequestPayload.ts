import type { Request, Response, NextFunction } from 'express';
import { skipEncryptionDecryptionRoutes } from '../utils/skipEncryptionDecryptionRoutes.js';
import { asymmetricDecryptionMsg } from '../utils/asymmetricEncryptionDecryption.js';
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from '../utils/AppErrorClass.js';
import { symmetricDecryptionMsg } from '../utils/symmetricEncryptionDecryption.js';
import logger from '../utils/logger.js';
import { getDnsConfigService } from '../services/configServices.js';

const decryptRequestPayload = (req: Request, res: Response, next: NextFunction) => {
    const skipEncryptionDecryptionRoute = (req: Request): boolean => {
        const url = req.originalUrl || req.url;

        return (
            url?.includes("/helper") ||
            url?.includes("/getDnsConfig") ||
            url?.includes('/getEncryptionKey') ||
            url?.includes('/getPublicKey') ||
            url?.includes('/getHeaderPublicKey') || 
            url?.includes('/signUp') || 
            url?.includes("/login")
        );
    };
    try {
        // Skip Decryption For Specified Routes
        if (skipEncryptionDecryptionRoute(req)) {
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
        throw new ServiceUnavailableError("DecryptRequestPayloadMiddleware service is facing unknown issue.", error)
    }
};

export default decryptRequestPayload;