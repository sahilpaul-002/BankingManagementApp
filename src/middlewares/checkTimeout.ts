import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import errorHandler from "../utils/errorHandler.js";
import dotenv from "dotenv";

dotenv.config();
const ENVIRONMENT: string = process.env.NODE_ENV || "PRODUCTION";

const checkTimeout = (seconds: number): RequestHandler => {
    if (ENVIRONMENT?.toUpperCase() !== "PRODUCTION") {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }

    return (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                // return res.status(503).json({status: "SERVICE_UNAVAILABLE", message: "SERVICE TIME OUT"})
                errorHandler(req, res, new Error("API TIMEOUT"), 503, "SERVICE_UNAVAILABLE", "SERVICE TIME OUT")
            }
        }, seconds * 1000);

        const clearTimout = () => clearTimeout(timer);

        res.on("finish", clearTimout);
        res.on("close", clearTimout);
        res.on("error", clearTimout);

        next();
    }
}

export default checkTimeout;