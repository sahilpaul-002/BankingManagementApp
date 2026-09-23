import type { Request, Response, NextFunction } from "express";
import { asymmetricDecryptionMsg } from "../utils/asymmetricEncryptionDecryption.js";
import { AppErrorClass, ServiceError, UnauthenticatedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import { symmetricDecryptionMsg } from "../utils/symmetricEncryptionDecryption.js";
import { symmetricDecryptionBuffer } from "../utils/symmetricDecryptionBuffer.js";

const decryptMultipartFormDataPayload = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        // Validate Multipart Formdata Request
        const contentType = req.headers["content-type"];
        if (!contentType?.toLowerCase().startsWith("multipart/form-data")) {
            return next();
        }

        // Get request header "from_portal" to check the sorce the api call
        const fromPortal: string = (req?.headers["from-portal"] ?? "false") as string;
        // Check if the api call is not from portal
        if (fromPortal === "false") {
            return next();
        }

        // Extract RSA Payload
        const rsaPayload = req.body?.encryptedPayload1;

        if (!rsaPayload) {
            throw new ServiceError(
                "Multipart encrypted payload missing"
            );
        }

        // Decrypt RSA for IV Hex Key
        const rsaRes = asymmetricDecryptionMsg(
            req,
            rsaPayload as string
        );

        if (rsaRes?.status !== "SUCCESS") {
            if (rsaRes?.status === "NOT_FOUND") {
                throw new UnauthenticatedError(
                    "Unauthenticated session"
                );
            }

            throw new ServiceError(
                "RSA multipart decryption service caused error"
            );
        }

        let rsaData: {
            ivHex?: string;
        };

        try {
            rsaData = JSON.parse(rsaRes.decryptedText);
        } catch (error) {
            throw new ServiceError(
                "Invalid RSA decrypted multipart payload"
            );
        }

        const ivHex = rsaData?.ivHex;

        if (!ivHex) {
            throw new ServiceError(
                "RSA decryption service caused error - IV missing from RSA payload"
            );
        }

        // Decrypt Form Fields
        if (req.body?.encryptedPayload2) {
            const aesRes = symmetricDecryptionMsg(
                req,
                req.body.encryptedPayload2 as string,
                ivHex
            );

            if (aesRes?.status !== "SUCCESS") {
                if (aesRes?.status === "NOT_FOUND") {
                    throw new UnauthenticatedError(
                        "Unauthenticated session"
                    );
                }

                throw new ServiceError(
                    "AES multipart form field decryption service caused error"
                );
            }

            try {
                const decryptedBody = JSON.parse(
                    aesRes.decryptedText
                );

                req.body = decryptedBody;
            } catch (error) {
                throw new ServiceError(
                    "Invalid JSON after multipart form field decryption"
                );
            }
        }

        // DECRYPT MULTIPART FILES

        const uploadedFiles = req.files as
            | Record<string, Express.Multer.File[]>
            | undefined;

        if (uploadedFiles) {
            for (const files of Object.values(uploadedFiles)) {
                for (const file of files) {
                    if (!file?.buffer) {
                        throw new ServiceError(
                            "Multipart file buffer is missing"
                        );
                    }

                    const decryptFileRes =
                        symmetricDecryptionBuffer(
                            req,
                            file.buffer,
                            ivHex
                        );

                    if (decryptFileRes?.status !== "SUCCESS") {
                        if (
                            decryptFileRes?.status ===
                            "NOT_FOUND"
                        ) {
                            throw new UnauthenticatedError(
                                "Unauthenticated session"
                            );
                        }

                        throw new ServiceError(
                            "AES multipart file decryption service caused error"
                        );
                    }

                    // Replace encrypted file buffer
                    // with original decrypted file buffer.
                    file.buffer =
                        decryptFileRes.decryptedBuffer;

                    // Update file size after decryption.
                    file.size =
                        decryptFileRes.decryptedBuffer.length;
                }
            }
        }

        // STORE IV FOR RESPONSE ENCRYPTION

        (req as any).__ivHex = ivHex;

        return next();
    } catch (err) {
        const error = err as any;

        logger.error(error, {
            serviceName:
                "DecryptMultipartFormDataPayloadMiddleware",
            url: req.path || "UNKNOWN_URL",
            method: req.method,
        });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `DecryptMultipartFormDataPayloadMiddleware facing issue: ${error?.message ?? "Unknown error"}`,
            error?.error ?? error
        );
    }
};


export default decryptMultipartFormDataPayload;