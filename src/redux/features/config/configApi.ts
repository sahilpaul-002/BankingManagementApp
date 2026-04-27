import { axiosBaseQuery, createAxiosInstance } from '@/configs/axiosConfig'
import { CONFIG_URL } from '@/configs/constants'
import { ApplicationServiceError } from '@/errorHandling/error'
import type { apiErrorType } from '@/errorHandling/handleErrors'
import mapToRtkError from '@/errorHandling/mapToRtkError'
import { setDnsConfigDetails } from '@/redux/slice/config/configSlice'
import { aesDecryption, type DecryptResult } from '@/utils/aesDecryption'
import { aesEncryption } from '@/utils/aesEncryption'
import { rsaEncryption } from '@/utils/rsaEncryption'
import { createApi, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
const dnsBaseUrl = import.meta.env.VITE_DNS_BASE_URL
const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

interface dnsDataObjectType {
    domain_name: string
    agent_code: string
    subagent_code: string
    business_id: string
    dashboard_name: string
    program_id: string
    prefund_flag: boolean
    client_id: string
    x_api_key: string
    logo_url?: string | null
    base_url_api: string
    favicon?: string | null
    add_card_allowed: boolean
    crypto_allowed: boolean
    slogan_line_1?: string | null
    slogan_line_2?: string | null
    logo?: string | null
    currency_symbol: string
    currency_name: string
    currency_img: string
    signup_required: boolean
    dns_x_api_key: string
    portal_type: string
    m2p_allowed: boolean
    p2p_allowed: boolean
    accessToken: string
}

type processedDnsDataObjectType = {
    domain_name: string
    dashboard_name: string
    prefund_flag: boolean
    logo_url?: string | null
    base_url_api: string
    favicon?: string | null
    add_card_allowed: boolean
    crypto_allowed: boolean
    slogan_line_1?: string | null
    slogan_line_2?: string | null
    logo?: string | null
    currency_symbol: string
    currency_name: string
    currency_img: string
    signup_required: boolean
    portal_type: string
    m2p_allowed: boolean
    p2p_allowed: boolean
}

interface dnsConfigRequestType {
    domainName: string
}

interface dnsConfigResponseType extends dnsDataObjectType { }

type encryptionKeyResponseType = { key: string }

interface apiResponseType<T> {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

// ==============================
// DYNAMIC AXIOS INSTANCE
// ==============================
const axiosInstance = createAxiosInstance(
    `${dnsBaseUrl}${CONFIG_URL}`,
    {
        'dns-x-api-key': dnsXApiKey,
        'Content-Type': 'application/json',
    },
    ENVIRONMENT
)

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
                        url: `/getEncryptionKey`,
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
                        url: `/getPublicKey`,
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
                        url: `/getDnsConfig`,
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

                    // -------------------------------- Create Application Headers -------------------------------- \\
                    const applicationHeaders = {
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
                        url: `/getHeaderPublicKey`,
                        method: 'GET',
                    });
                    const rsaHeaderEncryptionPublicKey = (getHeaderRsaEncryptionPublicKeyResponse.data as apiResponseType<encryptionKeyResponseType>)?.data?.key;
                    if (!rsaHeaderEncryptionPublicKey) {
                        throw new ApplicationServiceError("Failed to get Header RSA key");
                    }
                    sessionStorage.setItem('headerPublicKey', rsaEncryptionPublicKey);
                    // console.log("RsaEncryptionPublicKey : ", rsaEncryptionPublicKey)
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\
                    // Encrypt header using RSA
                    const encryptedHeaders: Record<string, string> = {};

                    for (const [key, value] of Object.entries(applicationHeaders)) {
                        if (!value) continue; // skip undefined/null

                        const response = await rsaEncryption(
                            { value }, // wrap if your function expects object
                            rsaHeaderEncryptionPublicKey as string
                        );

                        encryptedHeaders[key] = response?.ciphertextBase64;
                    }
                    console.log("Encrypted headers: ", )
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

                    return {
                        data: {
                            status: "SUCCESS",
                            message: "DNS config fetch successfully",
                            data: decryptedData
                        }
                    };
                }
                catch (error) {
                    return mapToRtkError(error, "GET-DNS-CONFIG faced appilcation error ");
                }
            },

            async onQueryStarted(payload, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    // ✅ Store DNS config in slice
                    dispatch(setDnsConfigDetails(data?.data as dnsConfigResponseType))
                } catch (err) {
                    console.error('Failed to store DNS config')
                }
            },
        }),


        // =======================================================
        // AES ENCRYPTION KEY
        // =======================================================
        getAesEncryptionKey: build.query<apiResponseType<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `/getEncryptionKey`,
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<encryptionKeyResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GET-AES-ENCRYPTION faced application error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GET-AES-ENCRYPTION faced application error",
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
                    console.error('Failed to store AES key');
                }
            }
        }),


        // =======================================================
        // RSA ENCRYPTION PUBLIC KEY
        // =======================================================
        getRsaEncryptionPublicKey: build.query<apiResponseType<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `/getPublicKey`,
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<encryptionKeyResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GET-AES-ENCRYPTION faced application error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GET-AES-ENCRYPTION faced application error",
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
                    console.error('Failed to store RSA key');
                }
            },
        }),


        // =======================================================
        // RSA ENCRYPTION PUBLIC KEY
        // =======================================================
        getHeaderRsaEncryptionPublicKey: build.query<apiResponseType<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `/getHeaderPublicKey`,
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<encryptionKeyResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GET-AES-ENCRYPTION faced application error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GET-AES-ENCRYPTION faced application error",
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
                    console.error('Failed to store RSA key');
                }
            },
        }),
    }),
})

export const { useGetDnsConfigQuery, useLazyGetDnsConfigQuery, useGetAesEncryptionKeyQuery, useGetRsaEncryptionPublicKeyQuery } = configApis
