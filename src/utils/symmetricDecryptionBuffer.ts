import { type Request } from "express";
import type { decryptionFailedJson } from "../types/decryptionRespoonseTypes.js";
import crypto from "crypto"

export const symmetricDecryptionBuffer = (
    req: Request,
    encryptedBuffer: Buffer,
    ivHex: string
): { status: "SUCCESS"; decryptedBuffer: Buffer } | decryptionFailedJson => {
    const keyHex: string | undefined = req.session?.encryptionKey;

    if (!keyHex) {
        return {
            status: "NOT_FOUND",
            message: "Symmetric encryption key not found in the session",
        };
    }

    if (!encryptedBuffer || encryptedBuffer.length === 0) {
        return {
            status: "BAD_REQUEST",
            message: "Encrypted buffer not found",
        };
    }

    if (!ivHex) {
        return {
            status: "BAD_REQUEST",
            message: "IvHex not found in the function parameter",
        };
    }

    try {
        const key = Buffer.from(keyHex, "hex");
        const iv = Buffer.from(ivHex, "hex");

        if (encryptedBuffer.length < 16) {
            return {
                status: "BAD_REQUEST",
                message: "Invalid encrypted buffer",
            };
        }

        const authTag = encryptedBuffer.subarray(
            encryptedBuffer.length - 16
        );

        const encrypted = encryptedBuffer.subarray(
            0,
            encryptedBuffer.length - 16
        );

        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);

        const decryptedBuffer = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return {
            status: "SUCCESS",
            decryptedBuffer,
        };
    } catch (error) {
        return {
            status: "SERVICE_ERROR",
            message: "Buffer decryption failed",
        };
    }
};