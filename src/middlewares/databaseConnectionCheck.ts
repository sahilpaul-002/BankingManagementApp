import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { ServiceUnavailableError } from "../utils/AppErrorClass.js";

export const checkDatabaseConnection = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    if (mongoose.connection.readyState === 1) {
        throw new ServiceUnavailableError("Database service unavailable")
    }

    next();
}; 