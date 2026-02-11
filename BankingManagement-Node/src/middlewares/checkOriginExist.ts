import type { Request, Response, NextFunction, RequestHandler } from "express"
import type { failedResponseJson } from "../types/responseJson.js";

const checkOriginExist = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    const allowedOrigins: string[] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    const origin: string | undefined = req.headers["origin"];

    if (!origin) {
        return res.status(400).json({ status: "FORBIDDEN", message: "Origin header missing" });
    }

    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
            status: "FORBIDDEN",
            message: "Origin not allowed"
        });
    }
    next();
}

export default checkOriginExist;