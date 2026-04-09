import logger from "./logger.js";
import type { Request } from "express";
import type { errorStatusTypes } from "../types/responseJson.js";

type LogMeta = {
    url?: string;
    method?: string;
    status?: string;
    stack?: string;
    [key: string]: any;
};

// ✅ ERROR LOGGER
export const logError = (
    req: Request,
    error: any,
    customMessage?: string
) => {
    const logData: LogMeta = {
        message: customMessage || error.message,
        stack: error.stack,
        url: req.path,
        method: req.method,
    };

    logger.error(logData);
};

// ✅ WARN LOGGER (for controlled failures)
export const logWarn = (
    req: Request,
    status: errorStatusTypes,
    message: string,
    extra?: Record<string, any>
) => {
    const logData: LogMeta = {
        status,
        message,
        url: req.path,
        method: req.method,
        ...extra,
    };

    logger.warn(logData);
};