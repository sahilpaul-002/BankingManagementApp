import type { Request, Response, NextFunction, RequestHandler } from "express"
import type { failedResponseJson } from "../types/responseJson.js";

const checkOriginExist = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    const origin: string | undefined = req.headers["origin"];

    if (!origin) {
        return res.status(400).json({status: "BAD_REQUEST", message: "Origin header missing"});
    }
    next();
}

export default checkOriginExist;