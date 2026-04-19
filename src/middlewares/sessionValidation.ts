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
import { AppErrorClass } from '../utils/AppErrorClass.js';

const sessionValidation = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        // Skip portal header check for selcted pathes
        const excludedPaths: string[] = ["/signUp", "/login"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }

        // Check session exist
        if (!req.session) {
            throw new AppErrorClass(401, "INVALID_SESSION", "SESSION NOT FOUND")
        }

        // Check if session is tampered(if tampered then newly created session)
        if (req.session?.isNew) {
            throw new AppErrorClass(401, "INVALID_SESSION", "SESSION INVALID OR TAMPERED")
        }

        // Check if session is initialised
        if (!req.session?.initiated && !req.session?.lastActivity) {
            throw new AppErrorClass(401, "UNAUTHENTICATED", "SESSION NOT INITIATED OR SESSION TIMEDOUT")
        }

        // Check session valid
        if (!req.session?.valid) {
            throw new AppErrorClass(401, "UNAUTHENTICATED", "SESSION NOT VALID")
        }

        let userDetails: userDetailsSchemaTypes | null
        try {
            // Get user from DB
            const checkUserExistInDB = async (req: Request): Promise<userDetailsSchemaTypes | null> => {
                const userExistResponse: userDetailsSchemaTypes | null = await user_details.findById(req.session.userId);
                return userExistResponse;
            }
            userDetails = await checkUserExistInDB(req);

            // Check user exist in DB
            if (!userDetails) {
                try {
                    const destroySessionResponse = await destroySession(req, res);

                    if (destroySessionResponse?.status !== "SUCCESS") {
                        if ((destroySessionResponse as failedResponseJson)?.error) {
                            throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION", (destroySessionResponse as failedResponseJson)?.error)
                        }
                        else {
                            throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "FAILED TO DESTROY SESSION")
                        }
                    }
                    throw new AppErrorClass(403, "FORBIDDEN", "User does not exists");
                }
                catch (error) {
                    throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "DESTROY SESSION SERVICE FACING ISSUE.");
                }
            }

            // Check user activated
            if (!userDetails?.is_active) {
                const destroySessionResponse = await destroySession(req, res);
                throw new AppErrorClass(401, "UNAUTHORIZED", "User is not activated");
            }
        }
        catch {
            throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "Session user validation using databse is facing issue");
        }

        try {
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
                throw new AppErrorClass(401, "UNAUTHORIZED", "User is not authorized - Invalid user meta details");
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
                throw new AppErrorClass(401, "UNAUTHORIZED", "User is not authorized - Invalid user meta details");
            }
        }
        catch {
            throw new AppErrorClass(500, "INTERNAL_SERVER_ERROR", "Session IP validation using databse is facing issue");
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

        next();
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("Session validation is facing issue.")
    }
}

export default sessionValidation;