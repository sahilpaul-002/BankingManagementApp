import type { Request, Response, NextFunction, RequestHandler } from "express"
import type { failedResponseJson } from "../types/responseJson.js";
import { AppErrorClass, ForbiddenError } from "../utils/AppErrorClass.js";

const checkOriginExist = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Skip portal header check for selcted pathes
    const excludedPaths: string[] = ["/api/v1/helper", "/api/v1/config/getMobileCountryCodes", "/favicon.ico"];
    if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
        return next();
    }

    const allowedOrigins: string[] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    const origin: string | undefined = req.headers["origin"];

    if (!origin) {
        throw new ForbiddenError("'origin' HEADER IS MISSING");
    }

    if (!allowedOrigins.includes(origin)) {
        throw new ForbiddenError("ORIGIN NOT ALLOWED");
    }
    next();
}

export default checkOriginExist;