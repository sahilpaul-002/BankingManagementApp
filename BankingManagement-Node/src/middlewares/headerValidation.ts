import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import checkStringHeader from "../utils/checkStringHeader.js";
import { request } from "node:http";

const headerTypeValidation = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Validate Content-Type header for POST, PUT, PATCH requests
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const contentType: string | undefined = req.headers["content-type"];
        if (!contentType || !contentType.includes("application/json")) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'content-type' header must be application/json" });
        }
    }

    // Validate FROM_PORTAL header for all requests
    const fromPortal: string | null = checkStringHeader(req, "from-portal");
    if (!fromPortal) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'from-portal' MISSING OR NOT STRING" });
    }

    // Validate X-API-Key header for all requests
    const xApiKey: string | null = checkStringHeader(req, "x-api-key");
    if (!xApiKey) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'x-api-key' MISSING OR NOT STRING" });
    }

    next();
}

export default headerTypeValidation;