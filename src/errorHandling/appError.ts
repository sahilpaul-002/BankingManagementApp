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
    service?: string | undefined;
    isOperational: boolean;

    constructor(
        statusCode: number,
        status: ErrorStatusType,
        message: string,
        service?: string | undefined,
        error?: any
    ) {
        super(message);

        this.statusCode = statusCode;
        this.status = status;
        this.error = error;
        this.isOperational = true;
        this.service = service;

        // Object.setPrototypeOf(this, AppErrorClass.prototype);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}