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

const sessionValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {

    // Check session exist
    if (!req.session) {
        return res.status(400).json({ status: "NOT_FOUND", message: "SESSION NOT FOUND" });
    }

    // Check if session is tampered(if tampered then newly created session)
    if (req.session?.isNew) {
        return res.status(400).json({ status: "INVALID_SESSION", message: "SESSION INVALID OR TAMPERED" });
    }

    // Check if session is initialised
    if (!req.session?.initiated && !req.session?.lastActivity) {
        return res.status(400).json({ status: "INVALID_SESSION", message: "SESSION NOT INITIATED OR SESSION TIMEDOUT" });
    }

    // Skip user existance check for selcted pathes
    const excludedPaths: string[] = ["/api/v1/user/signUp"];
    if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
        return next();
    }
    else {
        // Skip session validity check for selcted pathes
        const excludedPaths: string[] = ["/api/v1/user/login"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }
        else {
            // Check session valid
            if (!req.session?.valid) {
                return res.status(400).json({ status: "INVALID_SESSION", message: "SESSION NOT VALID" });
            }

            // Get user from DB
            const checkUserExistInDB = async (req: Request): Promise<userDetailsSchemaTypes | null> => {
                const userExistResponse: userDetailsSchemaTypes | null = await user_details.findById(req.session.userId);
                return userExistResponse;
            }
            const userDetails: userDetailsSchemaTypes | null = await checkUserExistInDB(req);

            // Check user exist in DB
            if (!userDetails) {
                try {
                    if (!req.session) {
                        return res.status(200).json({ status: "SUCCESS", message: "NO ACTIVE SESSION FOUND" });
                    }

                    const sessionId = req.sessionID;

                    req.session.destroy((err): Response<successResponseJson> | Response<failedResponseJson> => {
                        if (err) {
                            console.error("Session destroy error:", err);
                            return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "FAILED TO DESTROY SESSION", error: err });
                        }

                        res.clearCookie("BMA_Business_Session");
                        res.clearCookie("BMA_Admin_Session");
                        res.clearCookie("BMA_User_Session");

                        return res.status(400).json({ status: "FORBIDDEN", message: "User does not exists" });
                    });
                }
                catch (error) {
                    errorHandler(req, res, error, 500, "INTERNAL_SERVER_ERROR", "DESTROY SESSION SERVICE FACING ISSUE.");
                }
            }

            // Check user activated
            if (!userDetails?.is_active) {
                const destroySessionResponse = await destroySession(req, res);
                return res.status(400).json({ status: "UNAUTHORIZED", message: "User is not activated" });
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
                const destroySessionResponse = await destroySession(req, res);
                return res.status(400).json({ status: "UNAUTHORIZED", message: "User is not authorized - Invalid user meta details" });
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
                const destroySessionResponse = await destroySession(req, res);
                return res.status(400).json({ status: "UNAUTHORIZED", message: "User is not authorized - Invalid user meta details" });
            }

            // // Check user status
            // if (["DISABLED", "BLOCKED"].includes(userDetails?.status?.toUpperCase() as string)) {
            //     const destroySessionResponse = await destroySession(req, res);
            //     return res.status(400).json({ status: "UNAUTHORIZED", message: "User account is disabled or blocked" });
            // }

            // Check user session version
            // if (req.session.sessionVersion !== user.sessionVersion) {
            //     req.session.destroy(() => { });
            //     return res.status(401).json({ message: "Session revoked" });
            // }
        }
    }

    next();
}

export default sessionValidation;