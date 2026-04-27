// src/errors/AppError.ts

export type ErrorStatusType =
    | 'BAD_REQUEST'
    | 'SERVICE_ERROR'
    | 'UNAUTHENTICATED'
    | 'UNAUTHORIZED'
    | 'INVALID_SESSION'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'INVALID_HEADER'
    | 'INVALID_REQUEST_BODY_PARAMETER'
    | 'INVALID_REQUEST_QUERY_PARAMETER'
    | 'SERVICE_TIMEOUT'
    | 'INTERNAL_SERVER_ERROR'
    | 'SERVICE_UNAVAILABLE'
    | 'APPLICATION_SERVICE_ERROR'
    | 'INTERNAL_APPLICATION_ERROR'

export class AppErrorClass extends Error {
    statusCode: number;
    status: ErrorStatusType;
    error?: any;
    isOperational: boolean;

    constructor(
        statusCode: number,
        status: ErrorStatusType,
        message: string,
        error?: any
    ) {
        super(message);

        this.statusCode = statusCode;
        this.status = status;
        this.error = error;
        this.isOperational = true;

        Object.setPrototypeOf(this, AppErrorClass.prototype);
    }
}