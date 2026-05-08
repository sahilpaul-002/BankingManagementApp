// middleware/errorHandler.ts

import type { Request, Response, NextFunction } from "express";
import { AppErrorClass } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import type { failedResponseJson } from "../types/responseJson.js";

const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response<failedResponseJson>,
    next: NextFunction
): void => {
    const error = err as any;
    const errorClassName = error?.constructor?.name || "UnknownErrorClass";

    logger.error({
        serviceName: errorClassName,
        message: err.message,
        stack: err.stack,
        url: req.path,
        method: req.method
    });

    if (res.headersSent) {
        return next(err);
    }

    // ✅ Handle AppError
    if (err instanceof AppErrorClass) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err.error
        });
        return;
    }

    // ❌ Unknown errors
    res.status(500).json({
        status: "INTERNAL_SERVER_ERROR",
        message: err?.message || err.stack?.split('\n').slice(0, 2).join('\n') || "Internal Server Error",
    });
};

export default globalErrorHandler;