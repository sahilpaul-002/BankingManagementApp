import { AppErrorClass } from "@/errorHandling/appError";
import { InternalApplicationError } from "@/errorHandling/error";
import axios from "axios";

const baseURL = import.meta.env.VITE_DNS_BASE_URL;

// Utility to safely get from sessionStorage
const getSessionItem = (key: string): string | null => {
    const value = sessionStorage.getItem(key);
    return value ? value : null;
};

export const getAesEncryptionKey = async (): Promise<string | null> => {
    try {
        let keyHex: string | null = getSessionItem("keyHex");

        if (!keyHex) {
            try {
                const result = await axios.get(`${baseURL}/getEncryptionKey`);

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
}

export const getRsaPublicKey = async (): Promise<string | null> => {
    try {
        let rsaEncryptionKey: string | null = getSessionItem("publicKey");

        if (!rsaEncryptionKey) {
            try {
                // const result = await dispatch(initiate()).unwrap();
                const result = await axios.get(`${baseURL}/getPublicKey`);

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