import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";

const headerValidations = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Validate X-API-KEY header for all requests
    const xApiKey: string = req.headers["x-api-key"] as string;

    if (xApiKey !== req.session?.sessiondata?.requestXApiKey) {
        return res.status(400).json({ status: "FORBIDDEN", message: "INVALID 'x-api-key'"})
    }

    next();
}

export default headerValidations;