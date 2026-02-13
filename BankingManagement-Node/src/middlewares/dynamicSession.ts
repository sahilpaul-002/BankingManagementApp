import session from "express-session";
import type { NextFunction, RequestHandler, Request, Response } from "express";
import type { SessionConfig, SessionError } from "../types/sessionTypes.js";
import type { failedResponseJson, successResponseJsonRedisCLient, successResponseJsonRedisStore } from "../types/responseJson.js";
import { getRedisClient } from "../configs/redisConfig.js";
import type { RedisClientType } from "redis";
import getRedisStore from "../configs/redisStore.js";
import buildSession from "./buildSession.js";
import type { RedisStore } from "connect-redis";

const dynamicSession = (): RequestHandler => async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {

    // Get Redis Client
    const redisClientResponse: successResponseJsonRedisCLient | failedResponseJson = getRedisClient();
    if (redisClientResponse.status === "FAILED") {
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to get Redis client", error: redisClientResponse.error });
    }
    const redisClient: RedisClientType | undefined = redisClientResponse.status === "SUCCESS" ? redisClientResponse.client : undefined;
    // Create Redis Store
    const redisStoreResponse: failedResponseJson | successResponseJsonRedisStore = await getRedisStore(redisClient);
    // console.log("Redis store response from getRedisStore function in dynamicSession middleware:", redisStoreResponse);

    if (redisStoreResponse.status === "FAILED") {
        console.error("Failed to create Redis store:", redisStoreResponse.message);
    }
    const redisStore: RedisStore | undefined = redisStoreResponse.status === "SUCCESS" ? redisStoreResponse.store : undefined;

    // Get Sessions
    const sessions: SessionConfig | SessionError | undefined = buildSession(req, redisStore);
    // console.log("Session configuration returned from buildSession function in dynamicSession middleware:", sessions);

    // Check Session
    if (!sessions) {
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to build session configuration" });
    }
    const sessionStatus: string = sessions && ("status" in sessions) ? sessions.status : "SUCCESS";
    if (sessionStatus === "INTERNAL_SERVER_ERROR") {
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to build session configuration" });
    }
    // Get business session from sessions
    const businessSession: session.SessionOptions | undefined = sessions && "businessSession" in sessions ? sessions.businessSession : undefined;
    // Get admin session from sessions
    const adminSession: session.SessionOptions | undefined = sessions && "adminSession" in sessions ? sessions.adminSession : undefined;
    // Get user session from sesssions
    const userSession: session.SessionOptions | undefined = sessions && "userSession" in sessions ? sessions.userSession : undefined;

    // Get Portal Header
    const portal: string = req.headers["portal"] as string; // Portal header is checked for string in previous middleware

    // const reqSession = req.app.locals.sessions;
    let activeSession: session.SessionOptions | undefined;
    if (portal?.toUpperCase() === "BUSINESS" ) {
        activeSession = businessSession
    }
    else if (portal?.toUpperCase() === "ADMIN") {
        activeSession = adminSession
    }
    else {
        activeSession = userSession
    }

    if (!activeSession) {
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to determine active session configuration" });
    }

    session(activeSession)(req, res, next);    // Call the express session middleware with the selected session config
}

export default dynamicSession;