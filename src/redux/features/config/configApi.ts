import { axiosBaseQuery, getAxiosInstance, setAxiosBaseURL } from '@/configs/axiosConfig'
import { ApplicationServiceError} from '@/errorHandling/error'
import type { apiErrorType } from '@/errorHandling/handleErrors'
import { setAppliationHeaders, setDnsConfigDetails, type applicationHeaderItemsType } from '@/redux/slice/config/configSlice'
import { aesDecryption, type DecryptResult } from '@/utils/aesDecryption'
import { aesEncryption } from '@/utils/aesEncryption'
import { rsaEncryption } from '@/utils/rsaEncryption'
import { createApi, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { apiResponseType, applicationHeadersType, dnsConfigRequestType, dnsConfigResponseType, encryptionKeyResponseType } from './configApisDataTypes'
import { logError } from '@/errorHandling/errorLogger'
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError'
import { CONFIG_URL } from '@/configs/constants'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
const dnsBaseUrl = import.meta.env.VITE_DNS_BASE_URL
const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

// ============================
// GET AXIOS INSTANCE
// ============================
const axiosInstance = getAxiosInstance();

// ==============================
// APIS
// ==============================
export const configApis = createApi({
    reducerPath: 'configApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =======================================================
        // DNS CONFIG DATA
        // =======================================================
        getDnsConfig: build.query<apiResponseType<dnsConfigResponseType>, dnsConfigRequestType>({
            async queryFn(payload, { dispatch }, _extraOptions, baseQuery) {
                try {
                    // ---------------------------- Get AES Encryption Key ---------------------------- \\
                    const getAesEncryptionKeyResponse = await baseQuery({
                        url: `${CONFIG_URL}/getEncryptionKey`,
                        method: 'GET',
                    });
                    const aesEncryptionKeyHex = (getAesEncryptionKeyResponse.data as apiResponseType<encryptionKeyResponseType>)?.data?.key;
                    if (!aesEncryptionKeyHex) {
                        throw new ApplicationServiceError("Failed to get AES key")
                    }
                    sessionStorage.setItem('keyHex', aesEncryptionKeyHex);
                    // console.log("aesEncryptionKeyHex: ", aesEncryptionKeyHex)
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\
                    // ----------------------------- Get RSA Encryption Key ----------------------------- \\
                    const getrsaEncryptionPublicKeyResponse = await baseQuery({
                        url: `${CONFIG_URL}/getPublicKey`,
                        method: 'GET',
                    });
                    const rsaEncryptionPublicKey = (getrsaEncryptionPublicKeyResponse.data as apiResponseType<encryptionKeyResponseType>)?.data?.key;
                    if (!rsaEncryptionPublicKey) {
                        throw new ApplicationServiceError("Failed to get RSA key");
                    }
                    sessionStorage.setItem('publicKey', rsaEncryptionPublicKey);
                    // console.log("RsaEncryptionPublicKey : ", rsaEncryptionPublicKey)
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

                    // --------------------------- Request Payload Creation --------------------------- \\ 
                    // Generate IV for decryption
                    const iv = window.crypto.getRandomValues(new Uint8Array(12));
                    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
                    // Encrypt payload using RSA
                    const rsaEncryptionResponse = await rsaEncryption({ ivHex }, rsaEncryptionPublicKey as string)

                    // Encrypt payload using AES
                    const aesEncryptionResponse = await aesEncryption(aesEncryptionKeyHex as string, { domainName: payload.domainName }, ivHex)

                    const encryptedPayloads = { encryptedPayload1: rsaEncryptionResponse?.ciphertextBase64, encryptedPayload2: aesEncryptionResponse?.ciphertextHex }
                    // ----------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX ----------------------------------- \\

                    const result = await baseQuery({
                        url: `${CONFIG_URL}/getDnsConfig`,
                        method: "GET",
                        params: encryptedPayloads,
                    });

                    // ---------------------------- Decrypt the respnose data using AES ---------------------------- \\
                    let decryptedData: dnsConfigResponseType;

                    if (typeof result.data?.data === "string") {
                        // Decrypt response
                        const cipherTextHex = result.data?.data;
                        const decryptAesMessageResponse: DecryptResult = await aesDecryption({
                            cipherTextHex,
                            ivHex,
                            aesEncryptionKeyHex
                        });

                        const unParsedDecryptedData = decryptAesMessageResponse?.decryptedText;
                        try {
                            decryptedData = JSON.parse(unParsedDecryptedData);
                        }
                        catch {
                            throw new ApplicationServiceError("GET-DNS-CONFIG - Invalid JSON after decryption")
                        }
                    }
                    else {
                        decryptedData = result.data;
                    }
                    // console.log("Config dns data: ", decryptedData);
                    // --------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------- \\

                    // ================================ Create Application Headers ================================ \\
                    const applicationHeaders: applicationHeadersType = {
                        'x-api-key': decryptedData?.x_api_key,
                        'agent-code': decryptedData?.agent_code,
                        'subagent-code': decryptedData?.subagent_code,
                        'program-id': decryptedData?.program_id,
                        'business-id': decryptedData?.business_id,
                        'client-id': decryptedData?.client_id,
                        'authorization': `Bearer ${decryptedData?.accessToken}`
                    }

                    // Encrypt Application Headers
                    // ----------------------------- Get RSA Encryption Key ----------------------------- \\
                    const getHeaderRsaEncryptionPublicKeyResponse = await baseQuery({
                        url: `${CONFIG_URL}/getHeaderPublicKey`,
                        method: 'GET',
                    });
                    const rsaHeaderEncryptionPublicKey = (getHeaderRsaEncryptionPublicKeyResponse.data as apiResponseType<encryptionKeyResponseType>)?.data?.key;
                    if (!rsaHeaderEncryptionPublicKey) {
                        throw new ApplicationServiceError("Failed to get Header RSA key");
                    }
                    sessionStorage.setItem('headerPublicKey', rsaHeaderEncryptionPublicKey);
                    // console.log("RsaEncryptionPublicKey : ", rsaEncryptionPublicKey)
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\
                    // Encrypt header using RSA
                    let encryptedHeaders: Partial<Record<keyof applicationHeadersType, string>> = {};

                    for (const key in applicationHeaders) {
                        const typedKey = key as keyof applicationHeadersType;

                        const value = applicationHeaders[typedKey];

                        if (!value) continue;

                        const response = await rsaEncryption(
                            { value },
                            rsaHeaderEncryptionPublicKey
                        );

                        encryptedHeaders[typedKey] = response?.ciphertextBase64;
                    }
                    // console.log("Encrypted headers: ", encryptedHeaders)
                    dispatch(setAppliationHeaders(encryptedHeaders as applicationHeaderItemsType))
                    // ================================ XXXXXXXXXXXXXXXXXXXXXX ================================ \\

                    return {
                        data: {
                            status: "SUCCESS",
                            message: "DNS config fetch successfully",
                            data: decryptedData
                        }
                    };
                }
                catch (err) {
                    const rtkError = rtkQueryCatchError(err, "GetDnsConfigQuery");
                    return rtkError;
                }
            },

            async onQueryStarted(payload, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    const { x_api_key, agent_code, subagent_code, program_id, business_id, client_id, accessToken, ...rest } = data?.data as dnsConfigResponseType
                    // ✅ Store DNS config in slice
                    dispatch(setDnsConfigDetails(rest))
                    // Set the dns base url in session storage
                    const dnsBaseUrl = rest?.base_url_api;
                    // setAxiosBaseURL(dnsBaseUrl)
                    sessionStorage.setItem('dnsBaseUrl', dnsBaseUrl)
                } catch (err) {
                    const error = err as any;
                    const url =
                        error?.config?.url ||
                        error?.url ||
                        "UNKNOWN_URL";
                    logError("ERROR", {
                        message: "GetDnsConfigQuery faced error while storing data in slice",
                        error: err,
                        context: url,
                    });
                }
            },
        }),


        // =======================================================
        // AES ENCRYPTION KEY
        // =======================================================
        getAesEncryptionKey: build.query<apiResponseType<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `${CONFIG_URL}/getEncryptionKey`,
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<encryptionKeyResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                const error = response as any;

                const url =
                    error?.data?.url ||
                    error?.url ||
                    "UNKNOWN_URL";

                logError("ERROR", {
                    message: "GetAesEncryptionKey query failed",
                    error: response,
                    context: url,
                });

                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GetAesEncryptionKey faced external application service error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GetAesEncryptionKey faced internal application service error",
                        error: response?.error
                    }
                };
            },

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    const key = data?.data?.key;
                    if (key) {
                        sessionStorage.setItem('keyHex', key);
                    }
                } catch (err) {
                    const error = err as any;
                    const url =
                        error?.config?.url ||
                        error?.url ||
                        "UNKNOWN_URL";
                    logError("ERROR", {
                        message: "GetAesEncryptionKey query failed while storing data in sessionStorage",
                        error: err,
                        context: url,
                    });
                }
            }
        }),


        // =======================================================
        // RSA ENCRYPTION PUBLIC KEY
        // =======================================================
        getRsaEncryptionPublicKey: build.query<apiResponseType<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `${CONFIG_URL}/getPublicKey`,
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<encryptionKeyResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                const error = response as any;

                const url =
                    error?.data?.url ||
                    error?.url ||
                    "UNKNOWN_URL";

                logError("ERROR", {
                    message: "GetRsaEncryptionPublicKey query failed",
                    error: response,
                    context: url,
                });

                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GetRsaEncryptionPublicKey faced external application service error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GetRsaEncryptionPublicKey faced internal application service error",
                        error: response?.error
                    }
                };
            },

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log(data);

                    const publicKey = data?.data?.key;
                    if (publicKey) {
                        sessionStorage.setItem('publicKey', publicKey);
                    }
                } catch (err) {
                    const error = err as any;
                    const url =
                        error?.config?.url ||
                        error?.url ||
                        "UNKNOWN_URL";
                    logError("ERROR", {
                        message: "GetRsaEncryptionPublicKey query failed while storing data in sessionStorage",
                        error: err,
                        context: url,
                    });
                }
            },
        }),


        // =======================================================
        // RSA HEADER ENCRYPTION PUBLIC KEY
        // =======================================================
        getHeaderRsaEncryptionPublicKey: build.query<apiResponseType<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `${CONFIG_URL}/getHeaderPublicKey`,
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<encryptionKeyResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                const error = response as any;

                const url =
                    error?.data?.url ||
                    error?.url ||
                    "UNKNOWN_URL";

                logError("ERROR", {
                    message: "GetHeaderRsaEncryptionPublicKey query failed",
                    error: response,
                    context: url,
                });

                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GetHeaderRsaEncryptionPublicKey faced external application service error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GetHeaderRsaEncryptionPublicKey faced internal application service error",
                        error: response?.error
                    }
                };
            },

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log(data);

                    const publicKey = data?.data?.key;
                    if (publicKey) {
                        sessionStorage.setItem('headerPublicKey', publicKey);
                    }
                } catch (err) {
                    const error = err as any;
                    const url =
                        error?.config?.url ||
                        error?.url ||
                        "UNKNOWN_URL";
                    logError("ERROR", {
                        message: "GetHeaderRsaEncryptionPublicKey query failed while storing data in sessionStorage",
                        error: err,
                        context: url,
                    });
                }
            },
        }),
    }),
})

export const { useGetDnsConfigQuery, useLazyGetDnsConfigQuery, useGetAesEncryptionKeyQuery, useGetRsaEncryptionPublicKeyQuery } = configApis
