import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../configs/redisConfig.js';
import type { failedResponseJson } from '../types/responseJson.js';

const validateUniqueRequests = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        const requestId: string | undefined = req.headers["request-id"] as string | undefined;

        if (!requestId) {
            res.status(400).json({ status: "UNAUTHORIZED", message: "Request Id missing the request header" });
            return;
        }

        const key: string = `request-id:${requestId}`;

        const getRedisClientResponse = getRedisClient();
        if (!('client' in getRedisClientResponse) || !getRedisClientResponse.client) {
            res.status(500).json({ status: "ERROR", message: "Internal server error", error: "Redis client unavailable" });
            return;
        }
        const redisClient = getRedisClientResponse?.client;

        const exists: number = await redisClient.exists(key);

        if (exists) {
            res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthorized session" });
            return;
        }

        await redisClient.set(key, "used", {
            EX: 60 * 12,
        });

        next();
    } catch (err: unknown) {
        console.error(err);
        res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Error occured while api request validation" });
    }
};

export default validateUniqueRequests;