import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";

const portalHeaderCheck = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    try {
        // Skip portal header check for selcted pathes
        const excludedPaths: string[] = ["/api/v1/helper", "/api/v1/config/getMobileCountryCodes"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }

        // Skip preflight requests
        if (req.method === "OPTIONS") {
            return next();
        }
        // Check Portal Header
        const portal: string | string[] | undefined = req.headers["portal"];

        // Check if header portal exist and  is string
        if (!portal || typeof portal !== "string") {
            throw new ForbiddenError("'portal' IS MISSING OR NOT STRING")
        }


        // Validate the portal header value
        if (portal?.toString()?.toUpperCase() !== "ADMIN" && portal?.toString()?.toUpperCase() !== "USER" && portal?.toString()?.toUpperCase() !== "BUSINESS") {
            throw new ForbiddenError("Invalid portal header value. Allowed values are 'admin' or 'user' or 'business'")
        }

        next();
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "PortalHeaderCheckMiddleware",
            // url: req.path,
            // method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("Portal header check validation is facing unknown issue.", error)
    }
}

export default portalHeaderCheck;