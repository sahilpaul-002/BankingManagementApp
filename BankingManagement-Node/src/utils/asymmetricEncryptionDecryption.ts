import type { Request } from "express";
import crypto from "crypto";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";

// Web Crypto Public & Private Key EncryptionDecryption
const KEY_SIZE = 2048; // or 4096

export const getAsymmetricKeyPair = (req: Request) => {
    // Check if keys present in the session
    if (!req.session.privateKey || !req.session.publicKey) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: KEY_SIZE,
            publicKeyEncoding: {
                type: "spki",
                format: "pem"
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem"
            }
        });

        // store inside session
        req.session.publicKey = publicKey;
        req.session.privateKey = privateKey;

        return {
            status: "Success",
            message: "Keys generated & stored in session",
            publicKey,
            privateKey
        };
    }

    // keys already exist → return existing values from session
    return {
        status: "Success",
        message: "Keys already exist in this session",
        publicKey: req.session.publicKey,
        privateKey: req.session.privateKey
    };
}

export const asymmetricDecryptionMsg = (req: Request, ciphertextBase64: string): decryptionSuccessJson | decryptionFailedJson => {
    // Get Private Key from session
    const privateKey: string | undefined = req.session.privateKey;

    // Cehck Private Key exist in session
    if (!privateKey) {
        return { status: "NOT_FOUND", message: "Assymetric private key not found in session" };
    }

    // Check Cipher Text exist
    if (!ciphertextBase64) {
        return { status: "BAD_REQUEST", message: "Cipher text not found in the function parameter" }
    }

    const buffer = Buffer.from(ciphertextBase64, "base64");

    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        buffer
    );

    // return decrypted.toString("utf8");
    return { status: "SUCCESS", decryptedText: decrypted.toString("utf8") };
}