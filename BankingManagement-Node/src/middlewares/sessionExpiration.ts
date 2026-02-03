import type { Response, Request, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";

const sessionExpiration = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    if (req.session) {
        // Check session expiry
        const now: number = Date.now();
        const maxAge: number = req.session?.cookie.maxAge ?? 0;
        console.log("Session Max Age:", maxAge);
        if (req.session?.lastActivity) {
            if (now - req.session?.lastActivity > maxAge) {
                req.session.destroy(() => {
                    res.clearCookie("BEMASession");
                    res.status(401).json({
                        status: "UNAUTHORIZED",
                        message: "Session expired due to inactivity"
                    });
                });
                return;
            }
        }
        else {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthorised Access: No Active Session Found" });
        }
    }
    else {
        return res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthorised Access: No Session Found" });
    }

    // Update the lastActivity timestamp
    req.session.lastActivity = Date.now();
    next();
}

export default sessionExpiration;