import { AppErrorClass } from "@/errorHandling/appError";
import { InternalApplicationError } from "@/errorHandling/error";

// -------------------------------- ENCRYPTIN JSON PAYLOAD(QUERY PARAMS / REQUEST PAYLOAD) -------------------------------- \\
// Utility to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

// Utility to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

interface encryptSuccessType {
    status: "SUCCESS";
    ciphertextHex: string;
    ivHex: string;
}

interface encryptErrorType {
    status: "error";
    message: string;
}

type encryptResultType = encryptSuccessType | encryptErrorType;

export async function aesEncryption<T extends object>(
    sessionKeyHex: string,
    // requestObj: Record<string, unknown>,
    requestObj: T,
    ivHex: string
): Promise<encryptSuccessType> {
    try {
        const keyBytes = hexToBytes(sessionKeyHex);
        const iv: BufferSource = hexToBytes(ivHex) as BufferSource;

        // ✅ Explicitly cast to BufferSource
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw",
            keyBytes as BufferSource,
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        );

        const plaintext = new TextEncoder().encode(JSON.stringify(requestObj));

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            plaintext
        );

        const ciphertextHex = bufferToHex(encryptedBuffer);

        return {
            status: "SUCCESS",
            ciphertextHex,
            ivHex
        };
    } catch (error: any) {
        if (error instanceof AppErrorClass) {
            throw error;
        }

        // fallback for non-error types
        throw new InternalApplicationError("AES Encryption service caused an unknown error", error);
    }
}
// ------------------------------------- xxxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------------- \\


// ------------------------------------ ENCRYPTING MULTIPART FORM ------------------------------------ \\
interface encryptedMultipartFileType {
    file: Blob;
    ivHex: string;
}

interface encryptMultipartFileSuccessType {
    status: "SUCCESS";
    encryptedFile: encryptedMultipartFileType;
}

interface encryptMultipartFileErrorType {
    status: "error";
    message: string;
}

export type encryptMultipartFileResultType = encryptMultipartFileSuccessType | encryptMultipartFileErrorType;

export async function aesEncryptMultipartFile(
    sessionKeyHex: string,
    file: File,
    ivHex: string
): Promise<encryptMultipartFileSuccessType> {
    try {
        if (!sessionKeyHex) {
            throw new InternalApplicationError(
                "AES encryption key is missing",
                "AesEncryptMultipartFile"
            );
        }

        if (!file) {
            throw new InternalApplicationError(
                "Multipart file is missing",
                "AesEncryptMultipartFile"
            );
        }

        if (!ivHex) {
            throw new InternalApplicationError(
                "AES IV is missing",
                "AesEncryptMultipartFile"
            );
        }

        const keyBytes = hexToBytes(sessionKeyHex);
        const iv = hexToBytes(ivHex);

        // Import AES key
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw",
            keyBytes,
            {
                name: "AES-GCM",
            },
            false,
            ["encrypt"]
        );

        // Read original file as binary
        const fileBuffer = await file.arrayBuffer();

        // Encrypt binary file
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv,
            },
            cryptoKey,
            fileBuffer
        );

        // Keep encrypted file as binary.
        // Do NOT convert large files to hex because that approximately doubles
        // the payload size.
        const encryptedFile = new Blob(
            [encryptedBuffer],
            {
                type: "application/octet-stream",
            }
        );

        return {
            status: "SUCCESS",
            encryptedFile: {
                file: encryptedFile,
                ivHex,
            },
        };
    } catch (error: any) {
        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new InternalApplicationError(
            "AES Multipart File Encryption service caused an unknown error",
            error
        );
    }
}
// ------------------------------------- xxxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------------- \\