import type { Response, Request, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import destroySession from "../utils/destroySession.js";
import { AppErrorClass } from "../utils/AppErrorClass.js";

const sessionExpiration = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    if (req.session) {
        // Check session expiry
        const now: number = Date.now();
        const maxAge: number = req.session?.cookie.maxAge ?? 0;

        if (req.session?.lastActivity) {
            if (now - req.session?.lastActivity > maxAge) {
                const destroySessionResponse = await destroySession(req, res);

                if (destroySessionResponse?.status !== "SUCCESS") {
                    // throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error)
                    if ((destroySessionResponse as failedResponseJson)?.error) {
                        throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error)
                    }
                    else {
                        throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION")
                    }
                }
                // req.session.destroy((err) => {
                //     if (err) {
                //         console.error("Session destroy error:", err);
                //         return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "FAILED TO DESTROY SESSION", error: err });
                //     }

                //     res.clearCookie("BMA_Business_Session");
                //     res.clearCookie("BMA_Admin_Session");
                //     res.clearCookie("BMA_User_Session");
                //     res.clearCookie("authToken");
                //     res.clearCookie("refreshToken");
                //     res.status(401).json({
                //         status: "UNAUTHORIZED",
                //         message: "Session expired due to inactivity"
                //     });
                // });
                throw new AppErrorClass(500, "UNAUTHORIZED", "Session expired due to inactivity")
            }
        }
        else {
            throw new AppErrorClass(400, "UNAUTHORIZED", "Unauthorised Access: No Active Session Found")
        }
    }
    else {
        throw new AppErrorClass(400, "UNAUTHORIZED", "Unauthorised Access: No Active Session Found")
    }

    // Update the lastActivity timestamp
    req.session.lastActivity = Date.now();

    next();
}

export default sessionExpiration;