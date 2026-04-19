import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../configs/redisConfig.js';
import type { failedResponseJson } from '../types/responseJson.js';
import { AppErrorClass } from '../utils/AppErrorClass.js';

const validateUniqueRequests = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        // // Skip portal header check for selcted pathes
        // const excludedPaths: string[] = ["/signUp", "/login"];
        // if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
        //     return next();
        // }

        const requestId: string | undefined = req.headers["request-id"] as string | undefined;

        if (!requestId) {
            throw new AppErrorClass(406, "INVALID_HEADER", "'request id' MISSING OR NOT STRING")
        }

        const key: string = `request-id:${requestId}`;

        const getRedisClientResponse = getRedisClient();
        if (!('client' in getRedisClientResponse) || !getRedisClientResponse.client) {
            throw new AppErrorClass(400, "ERROR", "Redis client unavailable")
        }
        const redisClient = getRedisClientResponse?.client;

        const exists: number = await redisClient.exists(key);

        if (exists) {
            throw new AppErrorClass(401, "UNAUTHORIZED", "Unauthorized session")
        }

        await redisClient.set(key, "used", {
            EX: 60 * 12,
        });

        next();
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("Api unique request id validation is facing issue.")
    }
};

export default validateUniqueRequests;