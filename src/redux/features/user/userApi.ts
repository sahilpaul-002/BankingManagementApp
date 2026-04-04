import axios, { AxiosError } from 'axios'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { selectDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import type { rootStateType } from '@/redux/sotre'
import { configApis } from '../config/configApi'
import { USER_URL } from '@/configs/constants'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV

interface SigninRequest {
    email: string
    password: string
}

interface SigninResponse {
    status: string
    message: string
    data?: object
    error?: any
}

// ==============================
// AXIOS INSTANCE
// ==============================
const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000', // 🔥 static base URL
    withCredentials: true,
    ...(ENVIRONMENT?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
    headers: {
        'portal': 'business',
        'from-portal': 'false',
        'Content-Type': 'application/json',
    },
})

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
        unknown,
        unknown
    > =>
        async ({ url, method, data, params }, { getState }) => {
            try {
                const state = getState() as rootStateType
                const dnsConfig = selectDnsConfigDetails(state)

                // ✅ Dynamic headers from Redux
                if (dnsConfig) {
                    axiosInstance.defaults.headers['x-api-key'] = dnsConfig.x_api_key
                    axiosInstance.defaults.headers['agent-code'] = dnsConfig.agent_code
                    axiosInstance.defaults.headers['subagent-code'] = dnsConfig.subagent_code
                    axiosInstance.defaults.headers['program-id'] = dnsConfig.program_id
                    axiosInstance.defaults.headers['business-id'] = dnsConfig.business_id
                    axiosInstance.defaults.headers['client-id'] = dnsConfig.client_id
                    axiosInstance.defaults.headers['authorization'] = `Bearer ${dnsConfig.accessToken}`
                }

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
        signIn: build.mutation<SigninResponse, SigninRequest>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
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
                    data: payload,
                })

                if ('error' in result) {
                    return { error: result.error }
                }

                return {
                    data: result.data as SigninResponse,
                }
            },
        }),
    }),
})

export const { useSignInMutation } = userApis
