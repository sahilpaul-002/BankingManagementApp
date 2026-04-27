import { AppErrorClass } from "@/errorHandling/appError";
import { InternalApplicationError } from "@/errorHandling/error";

interface DecryptSuccess {
    status: "SUCCESS";
    decryptedText: string;
}

interface DecryptError {
    status: "ERROR";
    message: string;
    error?: unknown;
}

export type DecryptResult = DecryptSuccess | DecryptError;

interface DecryptParams {
    cipherTextHex: string;
    ivHex: string;
    aesEncryptionKeyHex: string;
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
}

export async function aesDecryption({ cipherTextHex, ivHex, aesEncryptionKeyHex }: DecryptParams): Promise<DecryptSuccess> {
    try {
        const keyBytes = new Uint8Array(hexToArrayBuffer(aesEncryptionKeyHex));
        const iv = new Uint8Array(hexToArrayBuffer(ivHex));
        const data = new Uint8Array(hexToArrayBuffer(cipherTextHex)); // includes authTag at end

        // Import key
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw",
            keyBytes, // ✅ Uint8Array is valid BufferSource
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        // Decrypt
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv,
                tagLength: 128
            },
            cryptoKey,
            data
        );

        const decryptedText = new TextDecoder().decode(decryptedBuffer);

        return { status: "SUCCESS", decryptedText };
    } catch (error: any) {
        console.error("Decryption error:", error);
        if (error instanceof AppErrorClass) {
            throw error;
        }

        // fallback for non-error types
        throw new InternalApplicationError("AES Decryption function caused an unknown error", error);
    }
}