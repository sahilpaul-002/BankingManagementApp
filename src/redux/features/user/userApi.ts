import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { selectApplicaitonHeaders, selectDnsConfigDetails, setAppliationHeaders, type applicationHeaderItemsType, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import type { rootStateType } from '@/redux/sotre'
import { configApis } from '../config/configApi'
import { USER_URL } from '@/configs/constants'
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig'
import { ApplicationServiceError } from '@/errorHandling/error'
import mapToRtkError from '@/errorHandling/mapToRtkError'
import { helperApis } from '../helper/helperApis'
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError'
import executeBaseQuery from '../executeBaseQuery'
import { setAuthenticated } from '@/redux/slice/user/userSlice'
import { rsaEncryption } from '@/utils/rsaEncryption'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

type apiResponseDataType = Record<string, any>

interface signupRequestType {
    fullName: string
    email: string
    password: string
    confirmPassword: string
    gender: string
    dialCode: string
    countryCode: string
    phoneNumber: string
    dateOfBirth: Date
}

interface signinRequestType {
    email: string
    password: string
}

interface apiResponseType<T> {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

// =============================
// SET UP USER API HEADERS
// =============================
const userApiHeaders = (state: rootStateType) => {
    const applicationHeaders = selectApplicaitonHeaders(state);

    // Build user api headers
    const dynamicHeaders: Record<string, string> = {}

    if (applicationHeaders) {
        dynamicHeaders['x-api-key'] = applicationHeaders['x-api-key']!;
        dynamicHeaders['authorization'] = applicationHeaders['authorization']!;
    }
    return dynamicHeaders;
}

// ============================
// GET AXIOS INSTANCE
// ============================
const axiosInstance = getAxiosInstance();

// ==============================
// API
// ==============================
export const userApis = createApi({
    reducerPath: 'userApis',
    // baseQuery: axiosBaseQuery(),
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =====================================
        // Sign Up Api
        // =====================================
        signUp: build.mutation<apiResponseType<apiResponseDataType>, signupRequestType>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Check backend session
                    const getSessionResult = await dispatch(
                        helperApis.endpoints.getSession.initiate(undefined, {
                            forceRefetch: true,
                            subscribe: false,
                        })
                    )
                    const isSessionValid = (getSessionResult?.isSuccess && (getSessionResult?.data?.status?.toUpperCase() === "SUCCESS")) ? true : false

                    let dnsConfig = selectDnsConfigDetails(state)
                    if (!dnsConfig || !isSessionValid) {
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )

                        if (result.isError) {
                            throw new ApplicationServiceError("SIGN-UP - Failed to fetch DNS Config data")
                        }

                        dnsConfig = result.data?.data as dnsConfigDataType
                    }

                    // Get user api headers
                    const headers = userApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        throw new ApplicationServiceError("UserSignUp - Missing required dynamic api headers");
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${USER_URL}/signUp`,
                        method: 'POST',
                        headers,
                        params: { domainName: dnsConfig?.domain_name },
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    }
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "USER-SIGNUP faced appilcation error ");
                    return rtkError;
                }
            },
        }),



        // ======================================
        // Sign In Api
        // ======================================
        signIn: build.mutation<apiResponseType<apiResponseDataType>, signinRequestType>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    // Check backend session
                    const getSessionResult = await dispatch(
                        helperApis.endpoints.getSession.initiate(undefined, {
                            forceRefetch: true,
                            subscribe: false,
                        })
                    )
                    const isSessionValid = (getSessionResult?.isSuccess && (getSessionResult?.data?.status?.toUpperCase() === "SUCCESS")) ? true : false

                    let state = getState() as rootStateType

                    let dnsConfig = selectDnsConfigDetails(state)
                    if (!dnsConfig || !isSessionValid) {
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )

                        if (result.isError) {
                            throw new ApplicationServiceError("SIGN-IN - Failed to fetch DNS Config data")
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        dnsConfig = result.data?.data as dnsConfigDataType
                    }

                    // Get user api headers
                    const headers = userApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        throw new ApplicationServiceError("UserSignIn - Missing required dynamic api headers");
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${USER_URL}/login`,
                        method: 'POST',
                        headers,
                        params: { domainName: dnsConfig?.domain_name },
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    // Store user email in session storage
                    sessionStorage.setItem('userEmail', payload.email);

                    // Set the user details in slice
                    if (result.data?.data) {
                        const loginData = result.data.data;
                        // ================================ Create Application Headers ================================ \\
                        const loginHeaders = {
                            "business-id": loginData.businessId,
                            "program-id": loginData.programId,
                            "agent-code": loginData.agentCode,
                            "subagent-code": loginData.subagentCode,
                        };

                        // Encrypt Application Headers
                        // ----------------------------- Get RSA Encryption Key ----------------------------- \\
                        let rsaHeaderEncryptionPublicKey = sessionStorage.getItem('headerPublicKey');
                        if (!rsaHeaderEncryptionPublicKey) {
                            const headerKeyResult = await dispatch(
                                configApis.endpoints.getHeaderRsaEncryptionPublicKey.initiate(
                                    undefined,
                                    {
                                        forceRefetch: true,
                                        subscribe: false,
                                    }
                                )
                            );

                            if (headerKeyResult.isError) {
                                throw new ApplicationServiceError("SIGN-IN - Failed to get Header RSA encryption public key");
                            }
                            rsaHeaderEncryptionPublicKey = headerKeyResult.data?.data?.key ?? null;
                            if (!rsaHeaderEncryptionPublicKey) {
                                throw new ApplicationServiceError("SIGN-IN - Header RSA encryption public key is missing");
                            }
                        }
                        // ----------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\
                        // Encrypt header using RSA
                        const encryptedLoginHeaders: Partial<Record<keyof applicationHeaderItemsType, string>> = {};

                        for (const key of Object.keys(loginHeaders) as Array<keyof typeof loginHeaders>) {
                            const value = loginHeaders[key];

                            if (!value) continue;

                            const response = await rsaEncryption({ value }, rsaHeaderEncryptionPublicKey);

                            if (response?.status !== "SUCCESS") {
                                throw new ApplicationServiceError(
                                    "RSA Header Encryption facing unknown error",
                                    "RsaHeaderEncryption"
                                );
                            }

                            encryptedLoginHeaders[key] = response.ciphertextBase64;
                        }
                        // console.log("Encrypted headers: ", encryptedHeaders)
                        dispatch(setAppliationHeaders(encryptedLoginHeaders as applicationHeaderItemsType))

                        // ================================
                        // Sanitize Login Response
                        // ================================
                        const {
                            businessId,
                            programId,
                            agentCode,
                            subagentCode,
                            ...sanitizedLoginData
                        } = loginData;

                        // Replace response data with sanitized data
                        result.data.data = sanitizedLoginData;
                    }

                    // Update authentication status of user
                    dispatch(setAuthenticated(true));

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    }
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "USER-SIGNIN faced appilcation error ");
                    return rtkError;
                }
            },
        }),
    }),
})

export const { useSignInMutation, useSignUpMutation } = userApis
