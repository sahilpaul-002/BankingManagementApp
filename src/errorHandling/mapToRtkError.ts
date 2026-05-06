// utils/mapToRtkError.ts

import { AppErrorClass } from "./appError";
import { logError } from "./errorLogger";

const serializeError = (err: unknown) => {
    if (!err) return undefined;

    if (typeof err === "string") return err;

    if (err instanceof Error) {
        return {
            message: err.message,
            stack: err.stack,
            name: err.name
        };
    }

    try {
        return JSON.parse(JSON.stringify(err));
    } catch {
        return String(err);
    }
};

const mapToRtkError = (err: unknown, errorMessage: string) => {
    const error = err as any;
    const url =
        error?.config?.url ||
        error?.url ||
        "UNKNOWN_URL";

    logError("ERROR", {
        message: "External api application service error",
        error: err,
        context: url,
    });
    if (error instanceof AppErrorClass) {
        return {
            error: {
                status: error.statusCode,
                data: {
                    status: error.status,
                    message: error.message,
                    error: serializeError(error),
                }
            }
        };
    }

    return {
        error: {
            status: 500,
            data: {
                status: "INTERNAL_APPLICATION_ERROR",
                message: errorMessage,
                error: error instanceof Error
                    ? error.stack   // optional
                    : JSON.stringify(error) // safe fallback

            }
        }
    };
};

export default mapToRtkError;