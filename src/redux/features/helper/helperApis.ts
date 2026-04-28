import { createAxiosInstance } from "@/configs/axiosConfig"
import { HELPER_URL } from "@/configs/constants"
import { ApplicationServiceError } from "@/errorHandling/error"
import type { apiErrorType } from "@/errorHandling/handleErrors"
import { selectDnsConfigDetails } from "@/redux/slice/config/configSlice"
import type { rootStateType } from "@/redux/sotre"
import { createApi, type BaseQueryFn, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import type { AxiosInstance } from "axios"


const ENVIRONMENT = import.meta.env.VITE_REACT_ENV

type getSessionResponseType = {
    sessionId?: string;
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

            // ✅ Build headers dynamically from Redux state
            const dynamicHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
            }

            // ✅ Create instance dynamically per request
            const axiosInstance: AxiosInstance = createAxiosInstance(
                `${dnsConfig?.base_url_api}${HELPER_URL}` || `http://localhost:3000${HELPER_URL}`,
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
        } catch (error: any) {
            const formattedError: apiErrorType = {
                status: error?.response?.status || 500,
                data: {
                    status:
                        error?.response?.data?.status ??
                        "INTERNAL_APPLICATION_ERROR",

                    message:
                        error?.response?.data?.message ??
                        "Helper-Apis-BaseQuery faced application error",

                    error:
                        error?.response?.data?.error ??
                        error?.message ??
                        error
                }
            };

            return {
                error: formattedError
            };
        }
    }


// ==============================
// API
// ==============================
export const helperApis = createApi({
    reducerPath: 'helperApis',
    baseQuery: axiosBaseQuery(),
    endpoints: (build) => ({
        // =======================================================
        // GET SESSION
        // =======================================================
        getSession: build.query<apiResponseType<getSessionResponseType>, void>({
            query: () => ({
                url: "/get-session",
                method: 'GET'
            }),

            transformResponse: (response: apiResponseType<getSessionResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GET-SESSION faced application error",
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
        }),
    }),
})

export const { useGetSessionQuery } = helperApis