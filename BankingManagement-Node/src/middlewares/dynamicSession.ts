import session from "express-session";
import type { NextFunction, RequestHandler, Request, Response } from "express";
import type { SessionConfig } from "../types/sessionTypes.js";
import type { failedResponseJson } from "../types/responseJson.js";

const dynamicSession = (sessions: SessionConfig): RequestHandler => (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    const portal: string | string[] | undefined = req.headers["portal"];

    if (!portal) {
        return res.status(400).json({ status: "BAD_REQUEST", message: "Portal header is missing" });
    }

    // const reqSession = req.app.locals.sessions;
    const activeSession: session.SessionOptions = portal === "admin" ? sessions.adminSession : sessions.userSession;

    session(activeSession)(req, res, next);    // Call the express session middleware with the selected session config
}

export default dynamicSession;