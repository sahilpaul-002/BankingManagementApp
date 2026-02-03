import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { failedResponseJson } from '../types/responseJson.js';

const sessionValidation = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
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

    // Check session valid
    if (!req.session?.valid) {
        return res.status(400).json({ status: "INVALID_SESSION", message: "SESSION NOT VALID" });
    }

    // Check request security headers
    const requestXApiKey: string = req.headers['x-api-key'] as string;    // String header validtion done
    if (!requestXApiKey || requestXApiKey !== req.session?.sessiondata?.requestXApiKey) {
        return res.status(400).json({ status: "FORBIDDEN", message: "X-API-KEY MISMATCH" });
    }

    // Check user exist in DB
    // const user = await User.findById(req.session.userId);

    // if (!user) {
    //     req.session.destroy(() => { });
    //     return res.status(401).json({ message: "User no longer exists" });
    // }

    // Check user active status
    // if (user.isBlocked || user.isDisabled) {
    //     req.session.destroy(() => { });
    //     return res.status(403).json({ message: "Account disabled" });
    // }

    // Check user session version
    // if (req.session.sessionVersion !== user.sessionVersion) {
    //     req.session.destroy(() => { });
    //     return res.status(401).json({ message: "Session revoked" });
    // }

    next();
}

export default sessionValidation;