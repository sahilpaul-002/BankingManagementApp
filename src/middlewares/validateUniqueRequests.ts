import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../configs/redisConfig.js';
import type { failedResponseJson } from '../types/responseJson.js';
import { AppErrorClass, InvalidHeaderError, ServiceError, UnauthorizedError } from '../utils/AppErrorClass.js';
import logger from '../utils/logger.js';

const validateUniqueRequests = async (req: Request, res: Response, next: NextFunction): Promise<Response<failedResponseJson> | void> => {
    try {
        const requestId: string | undefined = req.headers["request-id"] as string | undefined;

        if (!requestId) {
            throw new InvalidHeaderError("'request id' MISSING OR NOT STRING")
        }

        const key: string = `request-id:${requestId}`;

        const getRedisClientResponse = getRedisClient();
        if (!('client' in getRedisClientResponse) || !getRedisClientResponse.client) {
            throw new ServiceError("Redis client unavailable")
        }
        const redisClient = getRedisClientResponse?.client;

        const exists: number = await redisClient.exists(key);

        if (exists) {
            throw new UnauthorizedError("Unauthorized session")
        }

        await redisClient.set(key, "used", {
            EX: 60 * 12,
        });

        next();
    }
    catch (err: any) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "ApiRequestIdValidation",
            // url: req.path,
            // method: req.method
        });
        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(
            `ApiRequestIdValidation facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
};

export default validateUniqueRequests;