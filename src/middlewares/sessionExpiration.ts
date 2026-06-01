import type { Response, Request, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import destroySession from "../utils/destroySession.js";
import { AppErrorClass, ForbiddenError, InternalSeverError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";

const sessionExpiration = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        const excludedPaths1: string[] = ["/api/v1/helper", "/api/v1/config", "/api/v1/user/signUp", "/api/v1/user/login"];

        if (!req.session || !req.session?.lastActivity || excludedPaths1.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }

        if (req.session) {
            // Check session expiry
            const now: number = Date.now();
            const maxAge: number = req.session?.cookie.maxAge ?? 0;

            if (req.session?.lastActivity) {
                if (now - req.session?.lastActivity > maxAge) {
                    const destroySessionResponse = await destroySession(req.session, res);

                    if (destroySessionResponse?.status !== "SUCCESS") {
                        if ((destroySessionResponse as failedResponseJson)?.error) {
                            return next(new InternalSeverError("FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error))
                        }
                        else {
                            return next(new InternalSeverError("FAILED TO DESTROY SESSION"))
                        }
                    }
                    return next(new UnauthenticatedError("Session expired due to inactivity"))
                }
            }
            else {
                return next(new UnauthenticatedError("Unauthenticated Access: No Active Session Found"))
            }
        }
        else {
            return next(new UnauthenticatedError("Unauthenticated Access: No Active Session Found"))
        }

        // Update the lastActivity timestamp
        req.session.lastActivity = Date.now();

        return next();
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SessionExpirationMiddleware",
            // url: req.path,
            // method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `Session expiration validation facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

export default sessionExpiration;