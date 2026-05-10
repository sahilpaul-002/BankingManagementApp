import type { errorStatusTypes } from "../types/responseJson.js";

export class AppErrorClass extends Error {
    public statusCode: number;
    public status: errorStatusTypes;
    public error?: any;
    public isOperational: boolean;

    constructor(statusCode: number, status: errorStatusTypes, message: string, error?: any) {
        super(message);

        this.statusCode = statusCode;
        this.status = status;
        // this.error = error instanceof Error ? error.message : error;
        this.error = error;
        this.isOperational = true;

        Object.setPrototypeOf(this, AppErrorClass.prototype);
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
export class ServiceTimeoutError extends AppErrorClass {
    constructor(message: string, error?: any) { super(429, 'SERVICE_TIMEOUT', message, error); }
}
export class InternalSeverError extends AppErrorClass {
    constructor(message: string, error?: any) { super(500, 'INTERNAL_SERVER_ERROR', message, error); }
}
export class ServiceUnavailableError extends AppErrorClass {
    constructor(message: string, error?: any) { super(503, 'SERVICE_UNAVAILABLE', message, error); }
}