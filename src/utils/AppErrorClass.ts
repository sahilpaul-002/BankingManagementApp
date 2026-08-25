import type { errorStatusTypes } from "../types/responseJson.js";

type SafeError = {
    message?: string;
    name?: string;
    code?: string;
    status?: number;
    method?: string;
    url?: string;
};

const sanitizeError = (error: any): SafeError | undefined => {
    if (!error) {
        return undefined;
    }

    // Axios error
    if (error?.isAxiosError || error?.config) {
        return {
            message:
                error?.response?.data?.message ||
                error?.response?.data?.error?.message ||
                error?.message ||
                "External service request failed",
            name: error?.name,
            code: error?.code,
            status: error?.response?.status,
            method: error?.config?.method?.toUpperCase(),
            // Only expose the URL/path, never the config object
            url: error?.config?.url,
        };
    }

    // Normal Error
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
        };
    }

    // Already sanitized/custom object
    if (typeof error === "object") {
        return {
            message: error.message,
            name: error.name,
            code: error.code,
            status: error.status,
            method: error.method,
            url: error.url,
        };
    }

    return {
        message: String(error),
    };
};

export class AppErrorClass extends Error {
    public statusCode: number;
    public status: errorStatusTypes;
    public error: SafeError | undefined;
    public isOperational: boolean;

    constructor(
        statusCode: number,
        status: errorStatusTypes,
        message: string,
        error?: any
    ) {
        super(message);

        this.statusCode = statusCode;
        this.status = status;
        this.error = sanitizeError(error);
        this.isOperational = true;

        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppErrorClass {
    constructor(message: string, error?: any) { super(400, 'BAD_REQUEST', message, error); }
}
export class ServiceError extends AppErrorClass {
    constructor(message: string, error?: any) { super(400, 'SERVICE_ERROR', message, error); }
}
export class ExternalServiceError extends AppErrorClass {
    constructor(message: string, error?: any) { super(400, 'EXTERNAL_SERVICE_ERROR', message, error); }
}
export class UnauthenticatedError extends AppErrorClass {
    constructor(message: string, error?: any) { super(401, 'UNAUTHENTICATED', message, error); }
}
export class UnauthorizedError extends AppErrorClass {
    constructor(message: string, error?: any) { super(401, 'UNAUTHORIZED', message, error); }
}
export class InvalidSessionError extends AppErrorClass {
    constructor(message: string, error?: any) { super(401, 'INVALID_SESSION', message, error); }
}
export class ForbiddenError extends AppErrorClass {
    constructor(message: string, error?: any) { super(403, 'FORBIDDEN', message, error); }
}
export class NotFoundError extends AppErrorClass {
    constructor(message: string, error?: any) { super(404, 'NOT_FOUND', message, error); }
}
export class InvalidHeaderError extends AppErrorClass {
    constructor(message: string, error?: any) { super(406, 'INVALID_HEADER', message, error); }
}
export class InvalidRequestBodyError extends AppErrorClass {
    constructor(message: string, error?: any) { super(406, 'INVALID_REQUEST_BODY_PARAMETER', message, error); }
}
export class InvalidRequestQueryError extends AppErrorClass {
    constructor(message: string, error?: any) { super(406, 'INVALID_REQUEST_QUERY_PARAMETER', message, error); }
}
export class InvalidRequestParamsError extends AppErrorClass {
    constructor(message: string, error?: any) { super(406, 'INVALID_REQUEST_PARAMS_PARAMETER', message, error); }
}
export class ServiceTimeoutError extends AppErrorClass {
    constructor(message: string, error?: any) { super(429, 'SERVICE_TIMEOUT', message, error); }
}
export class InternalSeverError extends AppErrorClass {
    constructor(message: string, error?: any) { super(500, 'INTERNAL_SERVER_ERROR', message, error); }
}
export class ServiceUnavailableError extends AppErrorClass {
    constructor(message: string, error?: any) { super(503, 'SERVICE_UNAVAILABLE', message, error); }
}