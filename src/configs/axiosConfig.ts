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
