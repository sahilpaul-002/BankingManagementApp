import axios, { AxiosError, type AxiosInstance } from 'axios'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { selectDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import type { rootStateType } from '@/redux/sotre'
import { configApis } from '../config/configApi'
import { USER_URL } from '@/configs/constants'
import { createAxiosInstance } from '@/configs/axiosConfig'
import { getAesEncryptionKey, getRsaPublicKey } from '@/services/getEncryptionKeys'
import { rsaEncryption } from '@/utils/rsaEncryption'
import { aesEncryption } from '@/utils/aesEncryption'
import { aesDecryption, type DecryptResult } from '@/utils/aesDecryption'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

interface signinRequestType {
    email: string
    password: string
}

type signinResponseType = Record<string, any>

interface apiResponseType<T> {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

// ==============================
// CUSTOM BASE QUERY USING AXIOS
// ==============================
const axiosBaseQuery = (): BaseQueryFn<
    {
        url: string
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
        data?: unknown
        params?: unknown
        headers?: Record<string, string>
    },
    any,
    unknown
> =>
    async ({ url, method, data, params }, { getState }) => {
        try {
            const state = getState() as rootStateType
            const dnsConfig = selectDnsConfigDetails(state)

            // ✅ Build headers dynamically from Redux state
            const dynamicHeaders: Record<string, string> = {
                // 'portal': 'business',
                // 'from-portal': 'false',
                'dns-x-api-key': dnsXApiKey,
                'Content-Type': 'application/json',
            }

            if (dnsConfig) {
                dynamicHeaders['x-api-key'] = dnsConfig.x_api_key
                dynamicHeaders['agent-code'] = dnsConfig.agent_code
                dynamicHeaders['subagent-code'] = dnsConfig.subagent_code
                dynamicHeaders['program-id'] = dnsConfig.program_id
                dynamicHeaders['business-id'] = dnsConfig.business_id
                dynamicHeaders['client-id'] = dnsConfig.client_id
                dynamicHeaders['authorization'] = `Bearer ${dnsConfig.accessToken}`
            }

            // ✅ Create instance dynamically per request
            const axiosInstance: AxiosInstance = createAxiosInstance(
                dnsConfig?.base_url_api || 'http://localhost:3000',
                dynamicHeaders,
                ENVIRONMENT
            )

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

// ==============================
// API
// ==============================
export const userApis = createApi({
    reducerPath: 'userApis',
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        signIn: build.mutation<apiResponseType<signinResponseType>, signinRequestType>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                // ---------------------------- Get AES Encryption Key ---------------------------- \\
                // let aesEncryptionKeyHex = sessionStorage.getItem("keyHex");
                // if (!aesEncryptionKeyHex) {
                //     aesEncryptionKeyHex = await getAesEncryptionKey(dispatch, configApis.endpoints.getAesEncryptionKey.initiate)
                //     if (!aesEncryptionKeyHex) {
                //         throw new Error("Failed to get AES key");
                //     }
                // }
                const aesEncryptionKeyHex = await getAesEncryptionKey(dispatch, configApis.endpoints.getAesEncryptionKey.initiate)
                if (!aesEncryptionKeyHex) {
                    throw new Error("Failed to get AES key");
                }
                // console.log("aesEncryptionKeyHex: ", aesEncryptionKeyHex)
                // ----------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\
                // ----------------------------- Get AES Encryption Key ----------------------------- \\
                // let rsaEncryptionPublicKey = sessionStorage.getItem("publicKey");
                // if (!rsaEncryptionPublicKey) {
                //     rsaEncryptionPublicKey = await getRsaPublicKey(dispatch, configApis.endpoints.getRsaEncryptionPublicKey.initiate)
                //     if (!rsaEncryptionPublicKey) {
                //         throw new Error("Failed to get RSA key");
                //     }
                // }
                const rsaEncryptionPublicKey = await getRsaPublicKey(dispatch, configApis.endpoints.getRsaEncryptionPublicKey.initiate)
                if (!rsaEncryptionPublicKey) {
                    throw new Error("Failed to get RSA key");
                }
                // console.log("RsaEncryptionPublicKey : ", rsaEncryptionPublicKey)
                // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

                // --------------------------- Request Payload Creation --------------------------- \\ 
                // Generate IV for decryption
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
                // Encrypt payload using RSA
                const rsaEncryptionResponse = await rsaEncryption({ ivHex }, rsaEncryptionPublicKey as string)
                if (rsaEncryptionResponse?.status !== "SUCCESS") {
                    throw new Error("Failed to encrypt payload using RSA");
                }
                // console.log("RsaEncryptionResponse: ", rsaEncryptionResponse)

                // Encrypt payload using AES
                const aesEncryptionResponse = await aesEncryption(aesEncryptionKeyHex as string, payload, ivHex)
                if (aesEncryptionResponse?.status !== "SUCCESS") {
                    throw new Error("Failed to encrypt payload using AES");
                }
                // console.log("AesEncryptionResponse: ", aesEncryptionResponse)

                const encryptedRequestBody = { encryptedRequestBodyPayload1: rsaEncryptionResponse?.ciphertextBase64, encryptedRequestBodyPayload2: aesEncryptionResponse?.ciphertextHex }
                
                // Encrypt query payload using AES
                const aesQueryEncryptionResponse = await aesEncryption(aesEncryptionKeyHex as string, payload, ivHex)
                if (aesQueryEncryptionResponse?.status !== "SUCCESS") {
                    throw new Error("Failed to encrypt payload using AES");
                }
                const encryptedQueryParams = { encryptedQueryParam1: aesQueryEncryptionResponse.ciphertextHex}
                // ----------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX ----------------------------------- \\

                const state = getState() as rootStateType
                let dnsConfig = selectDnsConfigDetails(state)

                if (!dnsConfig) {
                    const result = await dispatch(
                        configApis.endpoints.getDnsConfig.initiate({
                            domainName: 'business.banking-management.com',
                        })
                    )

                    if (result.isError) {
                        return {
                            error: {
                                status: 400,
                                data: 'DNS Config not loaded',
                            },
                        }
                    }

                    dnsConfig = result.data?.data as dnsConfigDataType
                }

                const result = await baseQuery({
                    url: `${dnsConfig?.base_url_api}${USER_URL}/login`,
                    method: 'POST',
                    // params: {
                    //     domainName: dnsConfig?.domain_name
                    // },
                    params: encryptedQueryParams,
                    data: encryptedRequestBody,
                }) as {
                    data?: apiResponseType<signinResponseType>
                    error?: unknown
                }

                // ---------------------------- Decrypt the respnose data using AES ---------------------------- \\
                let decryptedData: apiResponseType<signinResponseType>;

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
                    decryptedData = result.data as apiResponseType<signinResponseType>;
                }
                // console.log("Config dns data: ", decryptedData);
                // --------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --------------------------- \\

                if ('error' in result) {
                    return { error: result.error }
                }

                return {
                    data: result.data as apiResponseType<signinResponseType>,
                }
            },
        }),
    }),
})

export const { useSignInMutation } = userApis
