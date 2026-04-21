import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import errorHandler from "../utils/errorHandler.js";
import dotenv from "dotenv";
import { ServiceTimeoutError } from "../utils/AppErrorClass.js";

dotenv.config();
const ENVIRONMENT: string = process.env.NODE_ENV || "PRODUCTION";

const checkTimeout = (seconds: number): RequestHandler => {
    if (ENVIRONMENT?.toUpperCase() !== "PRODUCTION") {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }

    return (req: Request, res: Response, next: NextFunction): void => {

        const timeoutMs = seconds * 1000;

        // ✅ 1. Application-level timeout (for user response)
        const appTimer = setTimeout(() => {
            if (!res.headersSent) {
                throw new ServiceTimeoutError("Service has timed out")
            }
        }, timeoutMs);

        // ✅ 2. Socket-level timeout (for killing stuck connections)
        req.setTimeout(timeoutMs + 1000, () => {
            // slight buffer so app timeout runs first
            if (!res.headersSent) {
                req.destroy(); // force close connection
            }
        });

        // ✅ Cleanup (VERY IMPORTANT)
        const cleanup = () => {
            clearTimeout(appTimer);
            req.setTimeout(0); // remove socket timeout
        };

        res.on("finish", cleanup);
        res.on("close", cleanup);
        res.on("SERVICE_ERROR", cleanup);

        next();
    };
};

export default checkTimeout;