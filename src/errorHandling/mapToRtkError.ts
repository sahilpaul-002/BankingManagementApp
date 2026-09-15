import { AxiosError } from "axios";
import { AppErrorClass } from "./appError";

type ZodErrorShape = {
    fieldErrors: Record<string, string[]>;
    formErrors: string[];
};

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

const isZodValidationError = (
    error: unknown
): error is ZodErrorShape => {

    if (
        typeof error !== "object" ||
        error === null
    ) {
        return false;
    }

    const zodError = error as Record<string, unknown>;

    return (
        typeof zodError.fieldErrors === "object" &&
        zodError.fieldErrors !== null &&
        Array.isArray(zodError.formErrors)
    );
};

const getZodErrorMessages = (
    zodError: ZodErrorShape
): string | string[] => {

    const messages = [
        ...Object.values(zodError.fieldErrors).flat(),
        ...zodError.formErrors,
    ].filter(
        (message): message is string =>
            typeof message === "string"
    );

    if (messages.length === 1) {
        return messages[0]!;
    }

    return messages;
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

        const zodError = error.data?.error?.error;

        if (isZodValidationError(zodError)) {
            return {
                error: {
                    ...error,
                    data: {
                        ...error.data,
                        message: getZodErrorMessages(zodError),
                    },
                },
            };
        }

        // Normal RTK error → don't modify it
        return {
            error,
        };
    }

    // =========================================
    // Axios Error
    // =========================================
    if (error instanceof AxiosError) {

        const responseData = error.response?.data;
        const zodError = responseData?.error?.error;

        return {
            error: {
                status: error.response?.status || 500,

                data: {
                    status:
                        responseData?.status ||
                        "EXTERNAL_SERVICE_ERROR",

                    message: isZodValidationError(zodError)
                        ? getZodErrorMessages(zodError)
                        : responseData?.message ||
                          error.message,

                    error: serializeError(responseData?.error) ||
                        serializeError(responseData) ||
                        serializeError(error),
                },
            },
        };
    }

    // =========================================
    // App Error
    // =========================================
    if (error instanceof AppErrorClass) {

        const zodError = error.error?.error;

        return {
            error: {
                status: error.statusCode,

                data: {
                    status: error.status,

                    message: isZodValidationError(zodError)
                        ? getZodErrorMessages(zodError)
                        : error.message,

                    error: serializeError(error.error),
                },
            },
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
            },
        },
    };
};

export default mapToRtkError;