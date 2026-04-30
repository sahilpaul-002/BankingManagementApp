import axios, { AxiosError, type AxiosInstance } from 'axios'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { selectApplicaitonHeaders, selectDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import type { rootStateType } from '@/redux/sotre'
import { configApis } from '../config/configApi'
import { USER_URL } from '@/configs/constants'
import { createAxiosInstance } from '@/configs/axiosConfig'
import { ApplicationServiceError } from '@/errorHandling/error'
import mapToRtkError from '@/errorHandling/mapToRtkError'
import { helperApis } from '../helper/helperApis'

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
            const dnsConfig = selectDnsConfigDetails(state);
            const applicationHeaders = selectApplicaitonHeaders(state);

            // ✅ Build headers dynamically from Redux state
            const dynamicHeaders: Record<string, string> = {
                'dns-x-api-key': dnsXApiKey,
                'Content-Type': 'application/json',
            }

            if (applicationHeaders) {
                dynamicHeaders['x-api-key'] = applicationHeaders['x-api-key'];
                dynamicHeaders['agent-code'] = applicationHeaders['agent-code'];
                dynamicHeaders['subagent-code'] = applicationHeaders['subagent-code'];
                dynamicHeaders['program-id'] = applicationHeaders['program-id'];
                dynamicHeaders['business-id'] = applicationHeaders['business-id'];
                dynamicHeaders['client-id'] = applicationHeaders['client-id'];
                dynamicHeaders['authorization'] = applicationHeaders['authorization'];
            }

            // ✅ Create instance dynamically per request
            const axiosInstance: AxiosInstance = createAxiosInstance(
                `${dnsConfig?.base_url_api}${USER_URL}` || `http://localhost:3000${USER_URL}`,
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
        } catch (error) {
            throw new ApplicationServiceError("User-Apis-BaseQuery faced application error", error)
        }
    }

// ==============================
// API
// ==============================
export const userApis = createApi({
    reducerPath: 'userApis',
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        // =====================================
        // Sign Up Api
        // =====================================
        signUp: build.mutation<apiResponseType<apiResponseDataType>, signupRequestType>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Check backend session
                    const getSessionResult = await dispatch(helperApis.endpoints.getSession.initiate())
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

                    const result = await baseQuery({
                        url: `${dnsConfig?.base_url_api}${USER_URL}/signUp`,
                        method: 'POST',
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
                    console.log(error);
                    return mapToRtkError(error, "USER-SIGNUP faced appilcation error ");
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
                    const getSessionResult = await dispatch(helperApis.endpoints.getSession.initiate())
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

                    const result = await baseQuery({
                        url: `${dnsConfig?.base_url_api}${USER_URL}/login`,
                        method: 'POST',
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
                    return mapToRtkError(error, "USER-SIGNIN faced appilcation error ");
                }
            },
        }),
    }),
})

export const { useSignInMutation, useSignUpMutation } = userApis
