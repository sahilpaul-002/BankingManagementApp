// src/utils/handleApiError.ts

import axios, { AxiosError } from 'axios';
import { AppErrorClass } from './appError';

export interface backendErrorType {
    status: string;
    message: string;
    error?: any;
}

export interface apiErrorType {
    status: number;
    data: backendErrorType;
}

const handleErrors = (error: unknown): never => {
    // Axios error
    if (axios.isAxiosError(error)) {
        const err = error as AxiosError<any>;

        const status = err.response?.status;
        const data = err.response?.data;

        const message =
            data?.message || err.message || 'Internal Application Error';

        switch (status) {
            case 400:
                console.error("BAD_REQUEST / ERROR");

            case 401:
                console.error("Unauthenticated / Unauthorized / INVALID_SESSION");

            case 403:
                console.error("FORBIDDEN");

            case 404:
                console.error("NOT_FOUND");

            case 406:
                console.error("INVALID_HEADER / INVALID_REQUEST_BODY_PARAMETER / INVALID_REQUEST_QUERY_PARAMETER");

            case 429:
                console.error("SERVICE_TIMEOUT");

            case 500:
                console.error("INTERNAL_SERVER_ERROR");

            case 503:
                console.error("SERVICE_UNAVAILABLE");

            default:
                throw new AppErrorClass(
                    status || 500,
                    data?.status || 'INTERNAL_SERVER_ERROR',
                    message,
                    data
                );
        }
    }

    // Non-Axios error
    if (error instanceof Error) {
        throw new AppErrorClass(601, 'APPLICATION_SERVICE_ERROR', error.message, error);
    }

    throw new AppErrorClass(600, 'INTERNAL_APPLICATION_ERROR', 'Internal application error occured', error);
};

export default handleErrors;