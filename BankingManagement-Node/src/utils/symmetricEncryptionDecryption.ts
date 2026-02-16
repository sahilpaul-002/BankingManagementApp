import crypto from "crypto";
import session, { type SessionData } from "express-session";
import { type Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";

// Function to generate web crypto key and store it in session
// export const getSymmetricEncryptionKey = (session: SessionData): {status: string, key: string} => {
export const getSymmetricEncryptionKey = (req: Request): {status: string, key: string | undefined} => {
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

export const symmetricDecryptionMsg = (req: Request, { ciphertextHex, ivHex }: {ciphertextHex: string, ivHex: string}): decryptionSuccessJson | decryptionFailedJson => {
    const response = getSymmetricEncryptionKey(req); // hex → raw bytes
    let key: Buffer;
    if (response?.status.toUpperCase() === "SUCCESS") {
        key = Buffer.from(response?.key as string, "hex");
    }
    else {
        return { status: "ERROR", message: "Failed to fetch web encryption key" };
    }
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