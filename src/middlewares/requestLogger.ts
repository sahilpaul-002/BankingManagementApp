import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

export default function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const start = performance.now();

    logger.info({
        serviceName: "NodeAPI",
        message: {
            event: "INCOMING_REQUEST",
            method: req.method,
            url: req.originalUrl,
        },
    });

    res.on("finish", () => {
        const responseTime = performance.now() - start;

        logger.info({
            serviceName: "NodeAPI",
            message: {
                event: "REQUEST_COMPLETED",
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                responseTime: `${responseTime.toFixed(4)}ms`,
            },
        });
    });

    next();
}