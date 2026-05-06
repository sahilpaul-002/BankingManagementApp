// utils/errorLogger.ts

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface ErrorLogPayload {
    message: string;
    error?: unknown;
    context?: string;
    metadata?: Record<string, any>;
}

export const logError = (
    level: LogLevel,
    payload: ErrorLogPayload
) => {
    const logData = {
        level,
        message: payload.message,
        context: payload.context || "UNKNOWN",
        metadata: payload.metadata || {},
        timestamp: new Date().toISOString(),
    };

    // Handle error object safely
    if (payload.error instanceof Error) {
        logData.metadata = {
            ...logData.metadata,
            errorMessage: payload.error.message,
            stack: payload.error.stack,
        };
    } else if (payload.error) {
        logData.metadata = {
            ...logData.metadata,
            error: payload.error,
        };
    }

    // Dev vs Prod handling
    if (import.meta.env.VITE_REACT_ENV === "DEVELOPMENT") {
        console.error("[APP ERROR]:", logData);
    }
};