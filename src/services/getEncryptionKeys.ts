import { apiRequest } from "@/configs/axiosConfig";
import { CONFIG_URL } from "@/configs/constants";
import { AppErrorClass } from "@/errorHandling/appError";
import { InternalApplicationError } from "@/errorHandling/error";
import { logError } from "@/errorHandling/errorLogger";
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
                // const result = await axios.get(`${baseURL}/getEncryptionKey`);
                const result = await apiRequest({
                    url: `${CONFIG_URL}/getEncryptionKey`,
                    method: 'GET',
                })

                const aesEncryptionKey = result?.data?.data?.key;

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
    catch (err) {
        const error = err as any;
        const url =
            error?.config?.url ||
            error?.url ||
            "UNKNOWN_URL";

        logError("ERROR", {
            message: "Api axios instance response interceptor error",
            error: err,
            context: url,
        });
        const className = error?.constructor?.name || "UnknownErrorClass";
        if (error instanceof AppErrorClass) {
            return Promise.reject(error);
        }
        throw new InternalApplicationError(`${className}: GetAesEncryptionKey service caused unknown error`, `AxiosApiResponseInterceptor`, error);
    }
}

export const getRsaPublicKey = async (): Promise<string | null> => {
    try {
        let rsaEncryptionKey: string | null = getSessionItem("publicKey");

        if (!rsaEncryptionKey) {
            try {
                // const result = await axios.get(`${baseURL}/getPublicKey`);
                const result = await apiRequest({
                    url: `${CONFIG_URL}/getPublicKey`,
                    method: 'GET',
                })
debugger
                const key = result?.data?.data?.key;

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
    catch (err) {
        const error = err as any;
        const url =
            error?.config?.url ||
            error?.url ||
            "UNKNOWN_URL";

        logError("ERROR", {
            message: "Api axios instance response interceptor error",
            error: err,
            context: url,
        });
        const className = error?.constructor?.name || "UnknownErrorClass";
        if (error instanceof AppErrorClass) {
            return Promise.reject(error);
        }
        throw new InternalApplicationError(`${className}: GetRsaEncryptionKey service caused unknown error`, `AxiosApiResponseInterceptor`, error);
    }
};