import type { Response, Request, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import destroySession from "../utils/destroySession.js";
import { AppErrorClass } from "../utils/AppErrorClass.js";

const sessionExpiration = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        // Skip portal header check for selcted pathes
        const excludedPaths: string[] = ["/signUp", "/login"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }

        if (req.session) {
            // Check session expiry
            const now: number = Date.now();
            const maxAge: number = req.session?.cookie.maxAge ?? 0;

            if (req.session?.lastActivity) {
                if (now - req.session?.lastActivity > maxAge) {
                    const destroySessionResponse = await destroySession(req, res);

                    if (destroySessionResponse?.status !== "SUCCESS") {
                        if ((destroySessionResponse as failedResponseJson)?.error) {
                            throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error)
                        }
                        else {
                            throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION")
                        }
                    }
                    throw new AppErrorClass(401, "UNAUTHENTICATED", "Session expired due to inactivity")
                }
            }
            else {
                throw new AppErrorClass(401, "UNAUTHENTICATED", "Unauthenticated Access: No Active Session Found")
            }
        }
        else {
            throw new AppErrorClass(401, "UNAUTHENTICATED", "Unauthenticated Access: No Active Session Found")
        }

        // Update the lastActivity timestamp
        req.session.lastActivity = Date.now();

        next();
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("Session expiration validation is facing issue.")
    }
}

export default sessionExpiration;