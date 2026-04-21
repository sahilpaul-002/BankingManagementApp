import { axiosBaseQuery, createAxiosInstance } from '@/configs/axiosConfig'
import { CONFIG_URL } from '@/configs/constants'
import { setDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import { aesDecryption, type DecryptResult } from '@/utils/aesDecryption'
import { aesEncryption } from '@/utils/aesEncryption'
import { rsaEncryption } from '@/utils/rsaEncryption'
import { createApi } from '@reduxjs/toolkit/query/react'
import { toast } from 'react-toastify'

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

interface dnsConfigRequestType {
    domainName: string
}

interface dnsConfigResponseType extends dnsDataObjectType { }

type encryptionKeyResponseType = { key: string }

interface ApiResponse<T> {
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
        // DNS CONFIG DATA
        getDnsConfig: build.query<ApiResponse<dnsConfigResponseType>, dnsConfigRequestType>({
            async queryFn(payload, { dispatch }, _extraOptions, baseQuery) {
                try {
                    // ---------------------------- Get AES Encryption Key ---------------------------- \\
                    // getAesEncryptionKey(dispatch, configApis.endpoints.getAesEncryptionKey.initiate)
                    const getAesEncryptionKeyResponse = await baseQuery({
                        url: `/getEncryptionKey`,
                        method: 'GET',
                    });
                    const aesEncryptionKeyHex = (getAesEncryptionKeyResponse.data as ApiResponse<encryptionKeyResponseType>)?.data?.key;
                    if (!aesEncryptionKeyHex) {
                        throw new Error("Failed to get AES key");
                    }
                    sessionStorage.setItem('keyHex', aesEncryptionKeyHex);
                    // console.log("aesEncryptionKeyHex: ", aesEncryptionKeyHex)
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\
                    // ----------------------------- Get AES Encryption Key ----------------------------- \\
                    const getrsaEncryptionPublicKeyResponse = await baseQuery({
                        url: `/getPublicKey`,
                        method: 'GET',
                    });
                    const rsaEncryptionPublicKey = (getrsaEncryptionPublicKeyResponse.data as ApiResponse<encryptionKeyResponseType>)?.data?.key;
                    if (!rsaEncryptionPublicKey) {
                        throw new Error("Failed to get RSA key");
                    }
                    sessionStorage.setItem('publicKey', rsaEncryptionPublicKey);
                    // console.log("RsaEncryptionPublicKey : ", rsaEncryptionPublicKey)
                    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

                    // --------------------------- Request Payload Creation --------------------------- \\ 
                    // Generate IV for decryption
                    const iv = window.crypto.getRandomValues(new Uint8Array(12));
                    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
                    // Encrypt payload using RSA
                    const rsaEncryptionResponse = await rsaEncryption({ ivHex }, rsaEncryptionPublicKey)
                    if (rsaEncryptionResponse?.status !== "SUCCESS") {
                        throw new Error("Failed to encrypt payload using RSA");
                    }
                    // console.log("RsaEncryptionResponse: ", rsaEncryptionResponse)

                    // Encrypt payload using AES
                    const aesEncryptionResponse = await aesEncryption(aesEncryptionKeyHex, { domainName: payload.domainName }, ivHex)
                    if (aesEncryptionResponse?.status !== "SUCCESS") {
                        throw new Error("Failed to encrypt payload using AES");
                    }
                    // console.log("AesEncryptionResponse: ", aesEncryptionResponse)

                    const encryptedPayloads = { encryptedPayload1: rsaEncryptionResponse?.ciphertextBase64, encryptedPayload2: aesEncryptionResponse?.ciphertextHex }

                    const result = await baseQuery({
                        url: `/getDnsConfig`,
                        method: "GET",
                        // params: { domainName: payload.domainName },
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

                        if (decryptAesMessageResponse?.status !== "SUCCESS") {
                            return {
                                error: {
                                    status: 500,
                                    data: "AES decryption failed"
                                }
                            };
                        }

                        const unParsedDecryptedData = decryptAesMessageResponse?.decryptedText;
                        try {
                            decryptedData = JSON.parse(unParsedDecryptedData);
                        }
                        catch {
                            return {
                                error: {
                                    status: 500,
                                    data: "Invalid JSON after decryption"
                                }
                            };
                        }
                    }
                    else {
                        decryptedData = result.data;
                    }
                    // console.log("Config dns data: ", decryptedData);
                    // --------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------- \\

                    // return {status: "SUCCESS", message: "DNS config fetch successfully", data: decryptedData}
                    return {
                        data: {
                            status: "SUCCESS",
                            message: "DNS config fetch successfully",
                            data: decryptedData
                        }
                    };
                }
                catch (error) {
                    return { error: error as any };
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

        // AES ENCRYPTION KEY
        getAesEncryptionKey: build.query<ApiResponse<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `/getEncryptionKey`,
                method: 'GET'
            }),

            transformResponse: (response: ApiResponse<encryptionKeyResponseType>) => response,

            transformErrorResponse: (response: any) => response,

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

        // RSA ENCRYPTION PUBLIC KEY
        getRsaEncryptionPublicKey: build.query<ApiResponse<encryptionKeyResponseType>, void>({
            query: () => ({
                url: `/getPublicKey`,
                method: 'GET'
            }),

            transformResponse: (response: ApiResponse<encryptionKeyResponseType>) => response,

            transformErrorResponse: (response: any) => response,

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
    }),
})

export const { useGetDnsConfigQuery, useLazyGetDnsConfigQuery, useGetAesEncryptionKeyQuery, useGetRsaEncryptionPublicKeyQuery } = configApis
