// utils/mapToRtkError.ts

import { AppErrorClass } from "./appError";

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

const mapToRtkError = (error: unknown, errorMessage: string) => {
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