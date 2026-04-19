import type { Request, Response, NextFunction, RequestHandler } from "express"
import type { failedResponseJson } from "../types/responseJson.js";
import { AppErrorClass } from "../utils/AppErrorClass.js";

const checkOriginExist = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    const allowedOrigins: string[] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    const origin: string | undefined = req.headers["origin"];

    if (!origin) {
        throw new AppErrorClass(403, "FORBIDDEN", "'origin' HEADER IS MISSING");
    }

    if (!allowedOrigins.includes(origin)) {
        throw new AppErrorClass(
            403,
            "FORBIDDEN",
            "ORIGIN NOT ALLOWED"
        )
    }
    next();
}

export default checkOriginExist;