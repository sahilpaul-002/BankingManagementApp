import { axiosBaseQuery, getAxiosInstance } from "@/configs/axiosConfig"
import { HELPER_URL } from "@/configs/constants"
import { logError } from "@/errorHandling/errorLogger"
import type { apiErrorType } from "@/errorHandling/handleErrors"
import { createApi, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react"


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

// ============================
// GET AXIOS INSTANCE
// ============================
const axiosInstance = getAxiosInstance();


// ==============================
// API
// ==============================
export const helperApis = createApi({
    reducerPath: 'helperApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =======================================================
        // GET SESSION
        // =======================================================
        getSession: build.query<apiResponseType<getSessionResponseType>, void>({
            query: () => ({
                url: `${HELPER_URL}/get-session`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }),

            transformResponse: (response: apiResponseType<getSessionResponseType>) => response,

            transformErrorResponse: (
                response: FetchBaseQueryError
            ): apiErrorType => {
                const error = response as any;

                const url =
                    error?.data?.url ||
                    error?.url ||
                    "UNKNOWN_URL";

                logError("ERROR", {
                    message: "GetAesEncryptionKey query failed",
                    error: response,
                    context: url,
                });

                if (typeof response.status === 'number') {
                    return {
                        status: response.status,
                        data: {
                            status: (response.data as any)?.status ?? "INTERNAL_APPLICATION_ERROR",
                            message: (response.data as any)?.message ?? "GetAesEncryptionKey faced external application service error",
                            error: (response.data as any)?.error ?? null,
                        }
                    };
                }

                // Handles FETCH_ERROR, PARSING_ERROR, etc.
                return {
                    status: 500,
                    data: {
                        status: "INTERNAL_APPLICATION_ERROR",
                        message: "GetAesEncryptionKey faced internal application service error",
                        error: response?.error
                    }
                };
            },
        }),
    }),
})

export const { useGetSessionQuery } = helperApis