type SafeExternalApiError = {
    message: string;
    method?: string;
    url?: string;
    status?: number;
    code?: string;
};

const sanitizeApiError = (error: any): SafeExternalApiError => {
    return {
        message:
            error?.response?.data?.message ||
            error?.response?.data?.error?.message ||
            error?.message ||
            "External service request failed",

        method: error?.config?.method?.toUpperCase(),

        url: error?.config?.baseURL
            ? `${error.config.baseURL}${error.config.url ?? ""}`
            : error?.config?.url,

        status: error?.response?.status,

        code: error?.code,
    };
}

export default sanitizeApiError