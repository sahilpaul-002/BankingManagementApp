import App from '@/App';
import { AppErrorClass } from '@/errorHandling/appError';
import { ApplicationServiceError, InternalApplicationError } from '@/errorHandling/error';
import handleErrors from '@/errorHandling/handleErrors';
import { getAesEncryptionKey, getRsaPublicKey } from '@/services/getEncryptionKeys';
import { aesDecryption } from '@/utils/aesDecryption';
import { aesEncryption } from '@/utils/aesEncryption';
import GetDeviceId from '@/utils/GetDeviceId';
import { rsaEncryption } from '@/utils/rsaEncryption';
import axios, { AxiosError, type AxiosInstance } from 'axios'

// Global Dispatch Handling - (To avoid circular store dependencies)
let globalDispatch: any = null;
export const setAxiosDispatch = (dispatch: any) => {
    globalDispatch = dispatch;
};

// Store ivHex value in WeakMap for in request cycle use
const ivStore = new WeakMap<object, string>();

// ==============================
// FACTORY FUNCTION FOR AXIOS INSTANCE
// ==============================
export const createAxiosInstance = (
    baseURL: string,
    headers: Record<string, string>,
    environment?: string,
): AxiosInstance => {
    const instance = axios.create({
        baseURL,
        withCredentials: true,
        ...(environment?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
        headers,
    })

    // ==========================
    // REQUEST INTERCEPTOR
    // ==========================
    instance.interceptors.request.use(
        async (req) => {
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
                if (err instanceof AppErrorClass) {
                    return Promise.reject(err);
                }
                throw new InternalApplicationError("Request interceptor service caused unknown error", err);
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
            catch (error) {
                if (error instanceof AppErrorClass) {
                    return Promise.reject(error);
                }
                throw new InternalApplicationError("Response interceptor service caused unknown error", error);
            }
        },
        async (error) => {
            // console.log("INTERCEPTOR ERROR HIT", {"URL": error.config?.url, "Status": error.response?.status, "Data": error.response?.data});

            if (globalDispatch) {
                handleErrors(error, globalDispatch);
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

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
        }: {
            url: string
            method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
            data?: unknown
            params?: unknown
        }) => {
            try {
                const result = await axiosInstance.request({
                    url,
                    method,
                    data,
                    params,
                })
                return { data: result.data }
            } catch (axiosError) {
                const err = axiosError as AxiosError
                return {
                    error: {
                        status: err.response?.status || 500,
                        data: err.response?.data || err.message,
                    },
                }
            }
        }
