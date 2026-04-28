import type { Request, Response, NextFunction } from "express";
import { ServiceError, UnauthenticatedError } from "../utils/AppErrorClass.js";
import { runWithRequest } from "../utils/requestContext.js";

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session) {
            throw new UnauthenticatedError("Session not initiated")
        }

        runWithRequest(
            { 
                requestSession: req.session,
                requestHeaders: req.headers
            },
            () => next()
        );
    } catch (err) {
        if (err instanceof UnauthenticatedError) {
            return next(err);
        }

        return next(new ServiceError('Request context service facing issue'));
    }
}