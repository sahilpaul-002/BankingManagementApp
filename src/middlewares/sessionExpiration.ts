import type { Response, Request, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import destroySession from "../utils/destroySession.js";
import {
    AppErrorClass,
    InternalSeverError,
    ServiceError,
    UnauthenticatedError
} from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";


const SESSION_INACTIVITY_TIMEOUT = 1000 * 60 * 12; // 12 minutes


const sessionExpiration = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response<failedResponseJson> | void> => {

    try {

        const excludedPaths: string[] = [
            "/api/v1/helper",
            "/api/v1/config",
            "/api/v1/user/signUp",
            "/api/v1/user/login",
            "/api/v1/twoFa/sendVerifyEmailCode",
            "/api/v1/twoFa/sendResetPasswordCode",
            "/api/v1/twoFa/verifyResetPasswordCode"
        ];


        // =========================================
        // EXCLUDED ROUTES
        // =========================================
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }


        // =========================================
        // NO SESSION
        // =========================================
        if (!req.session) {
            return next(
                new UnauthenticatedError(
                    "Unauthenticated Access: No Active Session Found"
                )
            );
        }


        // =========================================
        // NO LAST ACTIVITY
        // =========================================
        if (!req.session.lastActivity) {

            const destroySessionResponse = await destroySession(
                req.session,
                res
            );

            if (destroySessionResponse?.status !== "SUCCESS") {

                if (
                    (destroySessionResponse as failedResponseJson)?.error
                ) {
                    return next(
                        new InternalSeverError(
                            "FAILED TO DESTROY SESSION",
                            (destroySessionResponse as failedResponseJson)?.error
                        )
                    );
                }

                return next(
                    new InternalSeverError(
                        "FAILED TO DESTROY SESSION"
                    )
                );
            }

            return next(
                new UnauthenticatedError(
                    "Unauthenticated Access: No Active Session Found"
                )
            );
        }


        // =========================================
        // CHECK INACTIVITY
        // =========================================

        const now: number = Date.now();

        const inactiveTime: number =
            now - req.session.lastActivity;


        // =========================================
        // SESSION EXPIRED
        // =========================================

        if (inactiveTime >= SESSION_INACTIVITY_TIMEOUT) {

            const destroySessionResponse = await destroySession(
                req.session,
                res
            );

            if (destroySessionResponse?.status !== "SUCCESS") {

                if (
                    (destroySessionResponse as failedResponseJson)?.error
                ) {
                    return next(
                        new InternalSeverError(
                            "FAILED TO DESTROY SESSION",
                            (destroySessionResponse as failedResponseJson)?.error
                        )
                    );
                }

                return next(
                    new InternalSeverError(
                        "FAILED TO DESTROY SESSION"
                    )
                );
            }

            return next(
                new UnauthenticatedError(
                    "Session expired due to inactivity"
                )
            );
        }


        // =========================================
        // SESSION STILL ACTIVE
        // =========================================

        req.session.lastActivity = now;

        return next();

    }
    catch (err) {

        const error = err as any;

        const errorStatus =
            error?.status || "UnknownErrorStatus";


        logger.error(error, {
            serviceName: "SessionExpirationMiddleware"
        });


        if (error instanceof AppErrorClass) {
            throw error;
        }


        throw new ServiceError(`Session expiration validation facing issue: [${errorStatus}] ${error.message}`,error?.error ? error.error : error
        );
    }
};


export default sessionExpiration;