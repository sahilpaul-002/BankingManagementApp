// Utility to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
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
): Promise<encryptResultType> {
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
    } catch (err) {
        return { status: "error", message: "Encryption failed" };
    }
}
