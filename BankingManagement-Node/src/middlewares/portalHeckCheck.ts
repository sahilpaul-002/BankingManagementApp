import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";

const portalHeaderCheck = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Skip preflight requests
    if (req.method === "OPTIONS") {
        return next();
    }

    // Check Portal Header
    const portal: string | string[] | undefined = req.headers["portal"];

    // Check portal header exist
    if (!portal) {
        return res.status(400).json({ status: "FORBIDDEN", message: "Portal header is missing" });
    }

    // Validate the portal header value
    if (portal?.toString()?.toUpperCase() !== "ADMIN" && portal?.toString()?.toUpperCase() !== "USER") {
        return res.status(400).json({ status: "FORBIDDEN", message: "Invalid portal header value. Allowed values are 'admin' or 'user'" });
    }

    next();
}

export default portalHeaderCheck;