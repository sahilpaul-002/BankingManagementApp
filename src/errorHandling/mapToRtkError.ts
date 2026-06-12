import { AxiosError } from "axios";
import { AppErrorClass } from "./appError";

const serializeError = (err: unknown) => {
    if (!err) return undefined;

    if (typeof err === "string") {
        return err;
    }

    if (err instanceof Error) {
        return {
            message: err.message,
            stack: err.stack,
            name: err.name,
        };
    }

    try {
        return JSON.parse(JSON.stringify(err));
    } catch {
        return String(err);
    }
};

const mapToRtkError = (err: unknown) => {

    const error = err as any;

    // =========================================
    // Already RTK Query Error
    // =========================================
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "data" in error
    ) {
        return {
            error
        };
    }

    // =========================================
    // Axios Error
    // =========================================
    if (error instanceof AxiosError) {

        return {
            error: {
                status: error.response?.status || 500,
                data: {
                    status:
                        error.response?.data?.status ||
                        "EXTERNAL_SERVICE_ERROR",

                    message:
                        error.response?.data?.message ||
                        error.message,

                    error:
                        serializeError(error.response?.data) ||
                        serializeError(error),
                }
            }
        };
    }

    // =========================================
    // App Error
    // =========================================
    if (error instanceof AppErrorClass) {

        return {
            error: {
                status: error.statusCode,
                data: {
                    status: error.status,
                    message: error.message,
                    error: serializeError(error.error),
                }
            }
        };
    }

    // =========================================
    // Unknown Error
    // =========================================
    return {
        error: {
            status: 500,
            data: {
                status: "INTERNAL_APPLICATION_ERROR",
                message:
                    error?.message ||
                    "Unknown internal application error",

                error: serializeError(error),
            }
        }
    };
};

export default mapToRtkError;