import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import errorHandler from "../utils/errorHandler.js";
import dotenv from "dotenv";
import { ServiceTimeoutError } from "../utils/AppErrorClass.js";

dotenv.config();
const ENVIRONMENT: string = process.env.NODE_ENV || "PRODUCTION";

const checkTimeout = (seconds: number): RequestHandler => {
    if (ENVIRONMENT?.toUpperCase() !== "PRODUCTION") {
        return (_req, _res, next) => {
            next();
        };
    }

    return (req, res, next) => {
        const timeoutMs = seconds * 1000;

        const timer = setTimeout(() => {
            if (!res.headersSent) {
                next(new ServiceTimeoutError("Service has timed out"));
            }
        }, timeoutMs);

        const cleanup = () => {
            clearTimeout(timer);
        };

        res.on("finish", cleanup);
        res.on("close", cleanup);

        next();
    };
};

export default checkTimeout;