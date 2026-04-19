import axios, { AxiosError, type AxiosInstance } from 'axios'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { selectDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import type { rootStateType } from '@/redux/sotre'
import { configApis } from '../config/configApi'
import { USER_URL } from '@/configs/constants'
import { createAxiosInstance } from '@/configs/axiosConfig'
import GetDeviceId from '@/utils/GetDeviceId'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

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
                    params: {
                        domainName: dnsConfig?.domain_name
                    },
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
