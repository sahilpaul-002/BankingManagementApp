import App from '@/App';
import { AppErrorClass } from '@/errorHandling/appError';
import { ApplicationServiceError, InternalApplicationError } from '@/errorHandling/error';
import { logError } from '@/errorHandling/errorLogger';
import handleErrors from '@/errorHandling/handleErrors';
import { getAesEncryptionKey, getRsaPublicKey } from '@/services/getEncryptionKeys';
import { aesDecryption } from '@/utils/aesDecryption';
import { aesEncryption } from '@/utils/aesEncryption';
import GetDeviceId from '@/utils/GetDeviceId';
import { rsaEncryption } from '@/utils/rsaEncryption';
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'

// Global Dispatch Handling - (To avoid circular store dependencies)
let globalDispatch: any = null;
export const setAxiosDispatch = (dispatch: any) => {
    globalDispatch = dispatch;
};

// Store ivHex value in WeakMap for in request cycle use
const ivStore = new WeakMap<object, string>();

// ==============================
// SETUP INTERCEPTORS ON AXIOS INSTANCE
// ==============================
const setupInterceptors = (instance: AxiosInstance) => {

    // ==========================
    // REQUEST INTERCEPTOR
    // ==========================
    instance.interceptors.request.use(
        async (req) => {
            req.headers = req.headers ?? {};
            req.headers["portal"] = "business";
            req.headers["from-portal"] = "true";
            req.headers["request-id"] = crypto.randomUUID();

            const deviceId = await GetDeviceId();
            req.headers["x-device-id"] = deviceId;

            // SKIP ENCRYPTION FOR ENCRYPTION KEY APIs
            if (
                req.url?.includes("/getDnsConfig") ||
                req.url?.includes('/getEncryptionKey') ||
                req.url?.includes('/getPublicKey') ||
                req.url?.includes('/getHeaderPublicKey')
            ) {
                return req;
            }

            try {
                // GET KEYS (SESSION FIRST)
                let aesKey = sessionStorage.getItem('keyHex');
                let rsaKey = sessionStorage.getItem('publicKey');

                if (!aesKey || !rsaKey) {
                    sessionStorage.clear();
                    localStorage.clear();
                    const [aesKey, rsaKey] = await Promise.all([
                        getAesEncryptionKey(),
                        getRsaPublicKey()
                    ]);

                    if (!aesKey || !rsaKey) {
                        throw new ApplicationServiceError("Request payload encryption service cause error - Encryption keys missing");
                    }

                    sessionStorage.setItem('keyHex', aesKey);
                    sessionStorage.setItem('publicKey', rsaKey);
                }

                // GENERATE IV
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const ivHex = Array.from(iv)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                // store IV for response decryption in request config using WeakMap
                ivStore.set(req, ivHex);

                // RSA encrypt IV
                const rsaRes = await rsaEncryption({ ivHex }, rsaKey as string);
                // ENCRYPT BODY & PARAMS (POST/PUT/PATCH)
                if (req.data && req.params) {
                    const aesRes1 = await aesEncryption(aesKey as string, req.data, ivHex);

                    req.data = {
                        encryptedPayload1: rsaRes?.ciphertextBase64,
                        encryptedPayload2: aesRes1?.ciphertextHex,
                    };

                    const aesRes2 = await aesEncryption(aesKey as string, req.params, ivHex);

                    req.params = {
                        encryptedQueryPayload1: rsaRes?.ciphertextBase64,
                        encryptedQueryPayload2: aesRes2?.ciphertextHex,
                    };
                    return req;
                }

                // ENCRYPT BODY (POST/PUT/PATCH)
                if (req.data) {
                    const aesRes = await aesEncryption(aesKey as string, req.data, ivHex);

                    req.data = {
                        encryptedPayload1: rsaRes?.ciphertextBase64,
                        encryptedPayload2: aesRes?.ciphertextHex,
                    };
                    return req;
                }

                // ENCRYPT QUERY PARAMS (GET WITH PARAMS)
                if (req.params) {
                    const aesRes = await aesEncryption(aesKey as string, req.params, ivHex);

                    req.params = {
                        encryptedQueryPayload1: rsaRes?.ciphertextBase64,
                        encryptedQueryPayload2: aesRes?.ciphertextHex,
                    };
                    return req;
                }

                // ENCRYPT QUERY PARAMS FOR EMPTY GET/DELETE REQUESTS
                req.params = {
                    encryptedQueryPayload1: rsaRes?.ciphertextBase64,
                };

                return req;

            }
            catch (err) {
                const error = err as any;
                const url =
                    error?.config?.url ||
                    error?.url ||
                    "UNKNOWN_URL";

                logError("ERROR", {
                    message: "Api axios instance request interceptor error",
                    error: err,
                    context: url,
                });

                const className = error?.constructor?.name || "UnknownErrorClass";
                if (err instanceof AppErrorClass) {
                    return Promise.reject(err);
                }
                throw new InternalApplicationError(`${className}: Request interceptor service caused unknown error`, "AxiosApiRequestInterceptor", err);
            }
        },
        (error) => Promise.reject(error)
    );

    // ==========================
    // RESPONSE INTERCEPTOR
    // ==========================
    instance.interceptors.response.use(
        async (res) => {
            try {
                // DECRYPT RESPONSE (ONLY IF ENCRYPTED)
                const data = res?.data;

                if (data?.data && typeof data.data === 'string') {
                    const aesKey = sessionStorage.getItem('keyHex');
                    const ivHex = ivStore.get(res.config);

                    if (aesKey && ivHex) {
                        const decryptRes = await aesDecryption({
                            cipherTextHex: data.data,
                            ivHex,
                            aesEncryptionKeyHex: aesKey,
                        });

                        try {
                            res.data.data = JSON.parse(decryptRes.decryptedText);
                        } catch {
                            throw new Error("Invalid JSON after decryption");
                        }
                    }
                }

                return res;
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
                throw new InternalApplicationError(`${className}: Response interceptor service caused unknown error`, `AxiosApiResponseInterceptor`, error);
            }
        },
        async (err) => {
            const error = err as any;
            const url =
                error?.config?.url ||
                error?.url ||
                "UNKNOWN_URL";

            logError("ERROR", {
                message: "External api response interceptor error",
                error: err,
                context: url,
            });

            if (globalDispatch) {
                handleErrors(error, globalDispatch);
            }
            return Promise.reject(error);
        }
    );
};

// BASE URL CONFIGURATION
const API_BASE = window.location.hostname.includes("localhost") ? `${window.location.protocol}//${window.location.hostname}:3000` : "";

let axiosInstance: AxiosInstance | null = null;

// ==============================
// FACTORY FUNCTION FOR AXIOS API CLIENT
// ==============================
export const getAxiosInstance = (): AxiosInstance => {
    if (!axiosInstance) {
        axiosInstance = axios.create({
            withCredentials: true,
        });

        setupInterceptors(axiosInstance);
    }

    return axiosInstance;
};

// ==============================
// UPDATE AXIOS INSTANCE BASE URL
// ==============================
export const setAxiosBaseURL = (baseURL: string) => {
    if (!axiosInstance) return;

    axiosInstance.defaults.baseURL = baseURL;
};

// ==============================
// FACTORY FUNCTION API REQUEST
// ==============================
export const apiRequest = async ({
    route,
    url,
    method,
    data,
    params,
    headers,
}: {
    route: string
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    data?: any;
    params?: any;
    headers?: AxiosRequestConfig["headers"]
}) => {
    const axiosInstance = getAxiosInstance();

    return axiosInstance.request({
        url,
        method,
        data,
        params,
        ...(headers && { headers }),
    });
};

// ==============================
// CUSTOM BASE QUERY USING AXIOS
// ==============================
export const axiosBaseQuery =
    (axiosInstance: AxiosInstance) =>
        async ({
            url,
            method,
            data,
            params,
            headers
        }: {
            url: string
            method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
            data?: unknown
            params?: unknown
            headers?: AxiosRequestConfig["headers"]
        }) => {
            try {
                const result = await axiosInstance.request({
                    // url,
                    url: `${API_BASE}${url}` || `${sessionStorage.getItem("dnsBaseUrl")}${url}`,
                    method,
                    data,
                    params,
                    ...(headers && { headers }),
                })
                return { data: result.data }
            } catch (err) {
                const error = err as any;
                const url =
                    error?.config?.url ||
                    error?.url ||
                    "UNKNOWN_URL";

                logError("ERROR", {
                    message: "Axios base query error",
                    error: err,
                    context: url,
                });
                return {
                    error: {
                        status: error.response?.status || 500,
                        data: error.response?.data || error.message,
                    },
                }
            }
        }
