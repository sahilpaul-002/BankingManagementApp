// import axios, { AxiosError } from 'axios'
// import { CONFIG_URL } from './constants'


// const ENVIRONMENT = import.meta.env.VITE_REACT_ENV
// const dnsBaseUrl = import.meta.env.VITE_DNS_BASE_URL
// const dnsXApiKey = import.meta.env.VITE_DNS_X_API_KEY

// // ==============================
// // AXIOS INSTANCE
// // ==============================
// export const axiosInstance = axios.create({
//     baseURL: `${dnsBaseUrl}${CONFIG_URL}`,
//     withCredentials: true,
//     ...(ENVIRONMENT?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
//     headers: {
//         'portal': 'business',
//         'x-api-key': dnsXApiKey,
//         'Content-Type': 'application/json',
//     },
// })

// // ==============================
// // CUSTOM BASE QUERY USING AXIOS
// // ==============================
// const axiosBaseQuery = (): BaseQueryFn<
//     {
//         url: string
//         method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
//         data?: unknown
//         params?: unknown
//     },
//     unknown,
//     unknown
// > =>
//     async ({ url, method, data, params }) => {
//         try {
//             const result = await axiosInstance.request({
//                 url,
//                 method,
//                 data,
//                 params,
//             })
//             return { data: result.data }
//         } catch (axiosError) {
//             const err = axiosError as AxiosError
//             return {
//                 error: {
//                     status: err.response?.status || 500,
//                     data: err.response?.data || err.message,
//                 },
//             }
//         }
//     }

import axios, { AxiosError, type AxiosInstance } from 'axios'

// ==============================
// FACTORY FUNCTION FOR AXIOS INSTANCE
// ==============================
export const createAxiosInstance = (
    baseURL: string,
    headers: Record<string, string>,
    environment?: string
): AxiosInstance => {
    return axios.create({
        baseURL,
        withCredentials: true,
        ...(environment?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
        headers,
    })
}

// ==============================
// CUSTOM BASE QUERY USING AXIOS
// ==============================
export const axiosBaseQuery =
    (axiosInstance: AxiosInstance) =>
        async ({
            url,
            method,
            data,
            params,
        }: {
            url: string
            method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
            data?: unknown
            params?: unknown
        }) => {
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
