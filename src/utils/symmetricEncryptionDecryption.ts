import crypto from "crypto";
import session, { type SessionData } from "express-session";
import { type Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";

// Function to generate web crypto key and store it in session
// export const getSymmetricEncryptionKey = (session: SessionData): {status: string, key: string} => {
export const getSymmetricEncryptionKey = (req: Request): { status: string, key: string | undefined } => {
    if (req.session && !req?.session?.encryptionKey) {
        const rawKey: Buffer = crypto.randomBytes(32);  // 32 bytes = 256-bit key  AES-256 key
        const hexKey: string = rawKey.toString("hex");  // <-- convert to hex

        req.session.encryptionKey = hexKey;
        return { status: "SUCCESS", key: hexKey };
    }
    else {
        return { status: "SUCCESS", key: req?.session?.encryptionKey };
    }
}

export const symmetricDecryptionMsg = (req: Request, ciphertextHex: string, ivHex: string): decryptionSuccessJson | decryptionFailedJson => {
    // const response = getSymmetricEncryptionKey(req); // hex → raw bytes
    const keyHex: string | undefined = req.session?.encryptionKey;

    if (!keyHex) {
        return { status: "NOT_FOUND", message: "Symmetric encryption key not found in the session" }
    }
    if (!ciphertextHex) {
        return { status: "BAD_REQUEST", message: "Cipher text not found in the function parameter" }
    }
    if (!ivHex) {
        return { status: "BAD_REQUEST", message: "IvHex not found in the function parameter" }
    }

    const key: Buffer = Buffer.from(keyHex, "hex");
    const data: Buffer = Buffer.from(ciphertextHex, "hex");
    const iv: Buffer = Buffer.from(ivHex, "hex");

    const authTag: Buffer = Buffer.from(data.subarray(data.length - 16));
    const encrypted: Buffer = Buffer.from(data.subarray(0, data.length - 16));

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted: Buffer = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return { status: "SUCCESS", decryptedText: decrypted.toString("utf8") };
};


interface EncryptSuccessType {
    status: "SUCCESS";
    ciphertextHex: string;
    ivHex: string;
}

interface EncryptErrorType {
    status: "error";
    message: string;
}

type EncryptResultType = EncryptSuccessType | EncryptErrorType;

export const symmetricEncryptionMsg = (req: Request, responseObj: Record<string, unknown>, ivHex: string): EncryptResultType => {
    if (!req.session || !req.session.encryptionKey) {
        return { status: "error", message: "Failed to retrieve aes encryption key in session" };
    }
    const keyHex: string = req.session.encryptionKey;

    try {
        const key: Buffer = Buffer.from(keyHex, "hex");

        // Convert IV from hex
        const iv = Buffer.from(ivHex, "hex");

        // Convert response object to string
        const plaintext = JSON.stringify(responseObj);

        // Create cipher
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

        // Encrypt
        const encrypted = Buffer.concat([
            cipher.update(plaintext, "utf8"),
            cipher.final()
        ]);

        // Get auth tag (16 bytes)
        const authTag = cipher.getAuthTag();

        // Append authTag to encrypted data
        const finalBuffer = Buffer.concat([encrypted, authTag]);

        return {
            status: "SUCCESS",
            ciphertextHex: finalBuffer.toString("hex"),
            ivHex
        };
    } catch (err) {
        console.error("Encryption error:", err);
        return { status: "error", message: "Encryption failed" };
    }
}