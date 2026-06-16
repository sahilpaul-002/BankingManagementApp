import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { failedResponseJson, successResponseJson } from '../types/responseJson.js';
import { userDetailsModel as user_details } from '../models/user_details.js';
import errorHandler from '../utils/errorHandler.js';
import type { userDetailsSchemaTypes } from '../types/schemaTypes.js';
import destroySession from '../utils/destroySession.js';
import normalizeIp from '../utils/normalizeIp.js';
import { userMetaDetailsModel as user_meta_details } from '../models/user_meta_details.js';
import type { ObjectId } from 'mongoose';
import { AppErrorClass, ForbiddenError, InternalSeverError, InvalidSessionError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from '../utils/AppErrorClass.js';
import logger from '../utils/logger.js';

const sessionValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        // Check session exist
        if (!req.session) {
            throw new InvalidSessionError("SESSION NOT FOUND")
        }

        // Check if session is tampered(if tampered then newly created session)
        if (req.session?.isNew) {
            throw new InvalidSessionError("SESSION INVALID OR TAMPERED")
        }

        // Skip portal header check for selcted pathes
        const excludedPaths1: string[] = ["/signUp", "/login", "/sendResetPasswordCode", "/verifyResetPasswordCode"];
        if (excludedPaths1.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }
        else {
            // Check if session is initialised
            if (!req.session?.initiated && !req.session?.lastActivity) {
                throw new UnauthenticatedError("SESSION NOT INITIATED OR SESSION TIMEDOUT")
            }

            // Check session valid
            if (!req.session?.valid) {
                throw new UnauthenticatedError("SESSION NOT VALID")
            }

            let userDetails: userDetailsSchemaTypes | null
            // Get user from DB
            const checkUserExistInDB = async (req: Request): Promise<userDetailsSchemaTypes | null> => {
                const userExistResponse: userDetailsSchemaTypes | null = await user_details.findById(req.session.userId);
                return userExistResponse;
            }
            userDetails = await checkUserExistInDB(req);

            // Check user exist in DB
            if (!userDetails) {
                try {
                    const destroySessionResponse = await destroySession(req.session, res);

                    if (destroySessionResponse?.status !== "SUCCESS") {
                        if ((destroySessionResponse as failedResponseJson)?.error) {
                            throw new InternalSeverError("FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error)
                        }
                        else {
                            throw new InternalSeverError("FAILED TO DESTROY SESSION")
                        }
                    }
                    throw new ForbiddenError("User does not exists");
                }
                catch (error) {
                    throw new InternalSeverError("DESTROY SESSION SERVICE FACING ISSUE.");
                }
            }

            // Check user activated
            if (!userDetails?.is_active) {
                const destroySessionResponse = await destroySession(req.session, res);
                throw new UnauthorizedError("User is not activated");
            }

            // Check user meta details
            // Get the client IP address
            const getClientIP = (req: Request): string => {
                let ip =
                    (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0]?.trim() : undefined) ||
                    req.socket?.remoteAddress ||
                    req.connection?.remoteAddress ||
                    req.ip

                return normalizeIp(ip) as string;
            };
            const clientIp = getClientIP(req)

            // Get the device id from header
            const deviceId = req.headers['x-device-id'];

            // Check client-ip and device-id in session meata
            if (!req.session?.meta?.clientIp || !req.session?.meta?.deviceId || req.session.meta.clientIp !== clientIp || req.session.meta.deviceId !== deviceId) {
                const destroySessionResponse = await destroySession(req.session, res);
                throw new UnauthorizedError("User is not authorized - Invalid user meta details");
            }

            // Function to validate client IP and device ID
            async function validateUserMetaDetails(
                userId: string,
                clientIp: string,
                deviceId: string
            ): Promise<boolean> {
                const userMetaDetails = await user_meta_details.findOne({
                    user_id: userId,
                    device_id: deviceId,
                    ip_address: clientIp,
                }).lean();

                return userMetaDetails !== null;
            }
            const isValidMeta = await validateUserMetaDetails(userDetails._id.toString(), clientIp, deviceId as string);

            if (!isValidMeta) {
                const destroySessionResponse = await destroySession(req.session, res);
                throw new UnauthorizedError("User is not authorized - Invalid user meta details");
            }

            // Skip portal session check for selcted pathes
            const excludedPaths2 = ["/send2FaCode", "/verify2FaCode", "/enable2Fa"]
            if (excludedPaths2.some(p => req.path === p || req.path.startsWith(p + "/"))) {
                return next();
            }
            else {
                if (!req.session.is2faVerified) {
                    throw new UnauthorizedError("Unauthorised session - session validation faliure")
                }
            }

            // // Check user status
            // if (["DISABLED", "BLOCKED"].includes(userDetails?.status?.toUpperCase() as string)) {
            //     const destroySessionResponse = await destroySession(req, res);
            //     return res.status(401).json({ status: "UNAUTHORIZED", message: "User account is disabled or blocked" });
            // }

            // Check user session version
            // if (req.session.sessionVersion !== user.sessionVersion) {
            //     req.session.destroy(() => { });
            //     return res.status(401).json({ message: "Session revoked" });
            // }
        }

        return next();
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "SessionValidation",
            // url: req.path,
            // method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `SessionValidation facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}

export default sessionValidation;