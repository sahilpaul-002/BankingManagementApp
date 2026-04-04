// import { CONFIG_URL } from '@/configs/constants'
// import { setDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// const ENVIRONMENT = import.meta.env.VITE_REACT_ENV

// const dnsBaseUrl = import.meta.env.VITE_DNS_BASE_URL
// const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

// interface ConfigRequest {
//     domainName: string
// }

// interface DnsDataObject {
//     domain_name: string;
//     agent_code: string;
//     subagent_code: string;
//     business_id: string;
//     dashboard_name: string;
//     program_id: string;
//     prefund_flag: boolean;
//     client_id: string;
//     x_api_key: string;
//     logo_url?: string | null;
//     base_url_api: string;
//     favicon?: string | null;
//     add_card_allowed: boolean;
//     crypto_allowed: boolean;
//     slogan_line_1?: string | null;
//     slogan_line_2?: string | null;
//     logo?: string | null;
//     currency_symbol: string;
//     currency_name: string;
//     currency_img: string;
//     signup_required: boolean;
//     dns_x_api_key: string;
//     portal_type: string;
//     m2p_allowed: boolean;
//     p2p_allowed: boolean;
// }

// interface ConfigResponse {
//     status: string
//     message: string
//     data: DnsDataObject
// }

// export const configApis = createApi({
//     reducerPath: 'configApis',

//     baseQuery: fetchBaseQuery({
//         baseUrl: `${dnsBaseUrl}${CONFIG_URL}`,
//         prepareHeaders: (headers) => {
//             headers.set('portal', 'business')
//             headers.set('x-api-key', dnsXApiKey)
//             headers.set('Content-Type', 'application/json')
//             return headers
//         },
//         ...(ENVIRONMENT?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
//         credentials: "include"
//     }),

//     endpoints: (build) => ({
//         // ✅ FIXED → query instead of mutation
//         getDnsConfig: build.query<ConfigResponse, ConfigRequest>({
//             query: ({ domainName }) => ({
//                 url: `/getDnsConfig?domainName=${domainName}`, // ✅ GET uses query params
//                 method: 'GET',
//             }),

//             transformResponse: (response: ConfigResponse) => response,

//             transformErrorResponse: (response: any) => response,

//             async onQueryStarted(arg, { dispatch, queryFulfilled }) {
//                 try {
//                     const { data } = await queryFulfilled

//                     // Store data in config slice
//                     dispatch(setDnsConfigDetails(data.data as dnsConfigDataType))
//                 } catch (err) {
//                     console.error('Failed to store DNS config')
//                 }
//             },
//         }),
//     }),
// })

// export const { useGetDnsConfigQuery, useLazyGetDnsConfigQuery } = configApis

import { CONFIG_URL } from '@/configs/constants'
import { setDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import axios, { AxiosError } from 'axios'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
const dnsBaseUrl = import.meta.env.VITE_DNS_BASE_URL
const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

interface ConfigRequest {
    domainName: string
}

interface DnsDataObject {
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
}

interface ConfigResponse {
    status: string
    message: string
    data: DnsDataObject
}

// ==============================
// AXIOS INSTANCE
// ==============================
const axiosInstance = axios.create({
    baseURL: `${dnsBaseUrl}${CONFIG_URL}`,
    withCredentials: true,
    ...(ENVIRONMENT?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
    headers: {
        'portal': 'business',
        'x-api-key': dnsXApiKey,
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
        },
        unknown,
        unknown
    > =>
        async ({ url, method, data, params }) => {
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

// ==============================
// API
// ==============================
export const configApis = createApi({
    reducerPath: 'configApis',
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        getDnsConfig: build.query<ConfigResponse, ConfigRequest>({
            query: ({ domainName }) => ({
                url: `/getDnsConfig`,
                method: 'GET',
                params: { domainName }, // ✅ Axios handles query params
            }),

            transformResponse: (response: ConfigResponse) => response,

            transformErrorResponse: (response: any) => response,

            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    // ✅ Store DNS config in slice
                    dispatch(setDnsConfigDetails(data.data as dnsConfigDataType))
                } catch (err) {
                    console.error('Failed to store DNS config')
                }
            },
        }),
    }),
})

export const { useGetDnsConfigQuery, useLazyGetDnsConfigQuery } = configApis
