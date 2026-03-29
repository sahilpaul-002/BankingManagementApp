import type { Request, Response, NextFunction, RequestHandler } from "express"
import type { failedResponseJson } from "../types/responseJson.js";

const checkOriginExist = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    const allowedOrigins: string[] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    const origin: string | undefined = req.headers["origin"];

    if (!origin) {
        return res.status(400).json({ status: "FORBIDDEN", message: "'origin' HEADER IS MISSING" });
    }

    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
            status: "FORBIDDEN",
            message: "ORIGIN NOT ALLOWED"
        });
    }
    next();
}

export default checkOriginExist;