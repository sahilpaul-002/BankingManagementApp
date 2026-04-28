import { AppErrorClass } from "@/errorHandling/appError";
import { InternalApplicationError } from "@/errorHandling/error";

// Utility to safely get from sessionStorage
const getSessionItem = (key: string): string | null => {
    const value = sessionStorage.getItem(key);
    return value ? value : null;
};

export const getAesEncryptionKey = async (dispatch: any, initiate: any): Promise<string | null> => {
    try {
        let keyHex: string | null = sessionStorage.getItem("keyHex");

        if (!keyHex) {
            try {
                const result = await dispatch(initiate()).unwrap();

                const aesEncryptionKey = result?.data?.key;

                if (aesEncryptionKey) {
                    sessionStorage.setItem("keyHex", aesEncryptionKey);
                    keyHex = aesEncryptionKey;
                }

            } catch (error) {
                return Promise.reject(error);
            }
        }

        return keyHex;
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error;
        }

        // fallback for non-error types
        throw new InternalApplicationError("Get AES Encryption Key service caused an unknown error", error);
    }
};

export const getRsaPublicKey = async (dispatch: any, initiate: any): Promise<string | null> => {
    try {
        let rsaEncryptionKey: string | null = getSessionItem("publicKey");

        if (!rsaEncryptionKey) {
            try {
                const result = await dispatch(initiate()).unwrap();

                const key = result?.data?.key;

                if (key) {
                    sessionStorage.setItem("publicKey", key);
                    rsaEncryptionKey = key;
                }

            } catch (error) {
                return Promise.reject(error);
            }
        }

        return rsaEncryptionKey;
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error;
        }

        // fallback for non-error types
        throw new InternalApplicationError("Get RSA Encryption Key service caused an unknown error", error);
    }
};