import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { selectApplicaitonHeaders, selectDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import type { rootStateType } from '@/redux/sotre'
import { configApis } from '../config/configApi'
import { USER_URL } from '@/configs/constants'
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig'
import { ApplicationServiceError } from '@/errorHandling/error'
import mapToRtkError from '@/errorHandling/mapToRtkError'
import { helperApis } from '../helper/helperApis'
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError'

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
        dynamicHeaders['x-api-key'] = applicationHeaders['x-api-key'];
        dynamicHeaders['agent-code'] = applicationHeaders['agent-code'];
        dynamicHeaders['subagent-code'] = applicationHeaders['subagent-code'];
        dynamicHeaders['program-id'] = applicationHeaders['program-id'];
        dynamicHeaders['business-id'] = applicationHeaders['business-id'];
        dynamicHeaders['client-id'] = applicationHeaders['client-id'];
        dynamicHeaders['authorization'] = applicationHeaders['authorization'];
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
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: 'business.banking-management.com',
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

                    const result = await baseQuery({
                        url: `${USER_URL}/signUp`,
                        method: 'POST',
                        headers,
                        params: { domainName: dnsConfig?.domain_name },
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    if (result.error) {
                        return {
                            error: result.error,
                        };
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
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: 'business.banking-management.com',
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )

                        if (result.isError) {
                            throw new ApplicationServiceError("SIGN-IN - Failed to fetch DNS Config data")
                        }

                        dnsConfig = result.data?.data as dnsConfigDataType
                    }

                    // Get user api headers
                    const headers = userApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        throw new ApplicationServiceError("UserSignIn - Missing required dynamic api headers");
                    }

                    const result = await baseQuery({
                        url: `${USER_URL}/login`,
                        method: 'POST',
                        headers,
                        params: { domainName: dnsConfig?.domain_name },
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    // Store user email in session storage
                    sessionStorage.setItem('userEmail', payload.email);

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
