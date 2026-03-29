import { RedisStore } from "connect-redis";
import type { successResponseJsonRedisStore, failedResponseJson } from "../types/responseJson.js";
import type { RedisClientType } from "redis";

const getRedisStore = async (redisClient: RedisClientType | undefined): Promise<successResponseJsonRedisStore | failedResponseJson> => {
    if (redisClient) {
        const redisStore = new RedisStore({
            client: redisClient,
            ttl: 60 * 12 // 12 minutes
        })
        if (redisStore) {
            return ({status: "SUCCESS", message: "Redis store created successfully.", store: redisStore});
        }
        else {
            return ({status: "FAILED", message: "Redis store not initialised."});
        }
    }
    else {
        return ({status: "FAILED", message: "Redis client is not initialized."});
    }
}

export default getRedisStore;