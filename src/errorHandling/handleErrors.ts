// src/utils/handleApiError.ts

import axios, { AxiosError } from 'axios';
import { AppErrorClass } from './appError';
import { toast } from 'react-toastify';
import { setShowErrorBanner, setShowInfoBanner, triggerDestroySession } from '@/redux/slice/utility/utilitySlice';

export interface backendErrorType {
    status: string;
    message: string;
    error?: any;
}

export interface apiErrorType {
    status: number;
    data: backendErrorType;
}

const handleErrors = (error: unknown, dispatch: any): never => {
    // Axios error
    if (axios.isAxiosError(error)) {
        const err = error as AxiosError<any>;

        const statusCode = err.response?.status;
        const data = err.response?.data;
        const status = data?.status
        const message =
            data?.message || err.message || 'Internal Application Error';

        switch (statusCode) {
            case 400:
                console.error("BAD_REQUEST / SERVICE_ERROR", err);
                // toast.error("Internal application error")
                // dispatch(setShowInfoBanner("Application facing issue , please check the network"))
                throw error

            case 401:
                console.error("UNAUTHENTICATED / UNAUTHORIZED / INVALID_SESSION", err);
                if (status === "UNAUTHENTICATED") {
                    dispatch(triggerDestroySession({
                        title: 'Unauthenticated Session',
                        type: 'DEFAULT'
                    }))
                }
                else if (status === "UNAUTHORIZED") {
                    dispatch(triggerDestroySession({
                        title: 'Unauthorized Session',
                        type: 'DEFAULT'
                    }))
                }
                else if (status === "INVALID_SESSION") {
                    dispatch(triggerDestroySession({
                        title: 'Invalid Session',
                        type: 'DEFAULT'
                    }))
                }
                throw error

            case 403:
                dispatch(triggerDestroySession({
                    title: 'Forbidden Session Access',
                    type: 'DEFAULT'
                }))
                throw error

            case 404:
                console.error("NOT_FOUND", err);
                // toast.error("Request resorce or service not found")
                dispatch(setShowInfoBanner("Application facing issue , request resource might not be availbale"))
                throw error

            case 406:
                console.error("INVALID_HEADER / INVALID_REQUEST_BODY_PARAMETER / INVALID_REQUEST_QUERY_PARAMETER", err);
                // toast.error("Request parameter error")
                dispatch(setShowInfoBanner("Application facing issue , please check the network"))
                throw error

            case 429:
                console.error("SERVICE_TIMEOUT", err);
                // toast.error("Application time out")
                dispatch(triggerDestroySession({
                    title: 'Session Expiring',
                    type: 'SESSION_INACTIVITY',
                }))
                throw error

            case 500:
                console.error("INTERNAL_SERVER_ERROR", err);
                // toast.error("Internal server error")
                dispatch(setShowErrorBanner("Application facing internal server issue."))
                throw error

            case 503:
                console.error("SERVICE_UNAVAILABLE", err);
                // toast.error("Application service unavailbale")
                dispatch(setShowErrorBanner("Application facing service unavaibility issue"))
                throw error

            default:
                console.error("INTERNAL_SERVER_ERROR", err)
                // toast.error("Internal application error")
                dispatch(setShowErrorBanner("Application facing internal server issue."))
                throw new AppErrorClass(
                    statusCode || 500,
                    data?.status || 'INTERNAL_SERVER_ERROR',
                    message,
                    data
                );
        }
    }

    // Non-Axios error
    if (error instanceof Error) {
        console.error("APPLICATION_SERVICE_ERROR", error)
        // toast.error("Application service error")
        dispatch(setShowErrorBanner("Application facing internal service isssue"))
        throw new AppErrorClass(601, 'APPLICATION_SERVICE_ERROR', error.message,"ExternalServiceHandleErrors", error);
    }

    console.error("INTERNAL_APPLICATION_ERROR", error)
    // toast.error("Internal application error")
    dispatch(setShowErrorBanner("Application facing internal issue"));
    throw new AppErrorClass(600, 'INTERNAL_APPLICATION_ERROR', 'Internal application error occured', "ExternalServiceHandleErrors", error);
};

export default handleErrors;