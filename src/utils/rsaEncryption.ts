import { AppErrorClass } from "@/errorHandling/appError";
import { ApplicationServiceError, InternalApplicationError } from "@/errorHandling/error";

const enc = new TextEncoder();

/**
 * Convert PEM formatted key to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return bytes.buffer; // <-- return ArrayBuffer, not Uint8Array
}

/**
 * Import RSA public key from PEM string
 */
export async function importPublicKey(pemKey: string): Promise<CryptoKey | null> {
    if (!pemKey) {
        return null;
    }

    return await crypto.subtle.importKey(
        "spki",
        pemToArrayBuffer(pemKey), // ArrayBuffer is valid BufferSource
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        false,
        ["encrypt"]
    );
}

interface encryptSuccessType {
    status: "SUCCESS";
    ciphertextBase64: string;
}

interface encryptErrorType {
    status: "error";
    message: string;
}

type encryptResultType = encryptSuccessType | encryptErrorType;

/**
 * Encrypt a message using RSA-OAEP and return Base64 string
 */
export async function rsaEncryption(message: Record<string, any>, publicKeyPem: string): Promise<encryptSuccessType> {
    try {
        const publicKey = await importPublicKey(publicKeyPem);
        if (!publicKey) {
            throw new ApplicationServiceError("Encryption failed - Invalid public key");
        }

        const encrypted = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            enc.encode(JSON.stringify(message))
        );

        // Convert ArrayBuffer to Base64
        const encryptedBytes = new Uint8Array(encrypted);
        const encryptedString = String.fromCharCode(...encryptedBytes);
        const ciphertextBase64 = btoa(encryptedString);

        return {
            status: "SUCCESS",
            ciphertextBase64
        };
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error;
        }

        // fallback for non-error types
        throw new InternalApplicationError("RSA Encryption service caused an unknown error", error);
    }
}
