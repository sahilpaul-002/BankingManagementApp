import GetDeviceId from '@/utils/GetDeviceId';
import axios, { AxiosError, type AxiosInstance } from 'axios'

// ==============================
// FACTORY FUNCTION FOR AXIOS INSTANCE
// ==============================
export const createAxiosInstance = (
    baseURL: string,
    headers: Record<string, string>,
    environment?: string
): AxiosInstance => {
    const instance = axios.create({
        baseURL,
        withCredentials: true,
        ...(environment?.toUpperCase() === "PRODUCTION" && { timeout: 5000 }),
        headers,
    })

    // ==========================
    // REQUEST INTERCEPTOR
    // ==========================
    instance.interceptors.request.use(
        async (config) => {
             config.headers["portal"] = "business";
             config.headers["from-portal"] = "false";
            config.headers["request-id"] = crypto.randomUUID();

            const deviceId = await GetDeviceId();
            config.headers["x-device-id"] = deviceId;

            return config;
        },
        (error) => Promise.reject(error)
    );

    // ==========================
    // RESPONSE INTERCEPTOR
    // ==========================
    instance.interceptors.response.use(
        (response) => {
            // success response
            return response;
        },
        async (error) => {
            // error handling (global)
            if (error.response?.status === 400) {
                console.error("BAD_REQUEST / ERROR");
            }
            else if (error.response?.status === 401) {
                console.error("Unauthenticated / Unauthorized / INVALID_SESSION");
            }
            else if (error.response?.status === 403) {
                console.error("FORBIDDEN");
            }
            else if (error.response?.status === 404) {
                console.error("NOT_FOUND");
            }
            else if (error.response?.status === 406) {
                console.error("INVALID_HEADER / INVALID_REQUEST_BODY_PARAMETER / INVALID_REQUEST_QUERY_PARAMETER");
            }
            else if (error.response?.status === 429) {
                console.error("SERVICE_TIMEOUT");
            }
            else if (error.response?.status === 500) {
                console.error("INTERNAL_SERVER_ERROR");
            }
            else if (error.response?.status === 503) {
                console.error("SERVICE_UNAVAILABLE");
            }

            return Promise.reject(error);
        }
    );

    return instance;
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
