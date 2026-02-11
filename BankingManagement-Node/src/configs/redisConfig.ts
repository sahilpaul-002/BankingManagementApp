import { createClient, type RedisClientType } from 'redis';
import dotenv from "dotenv";
import type { failedResponseJson, successResponseJson, successResponseJsonRedisCLient } from '../types/responseJson.js';

dotenv.config();

let redisClient: RedisClientType | undefined;

export const redisConfig = async (): Promise<RedisClientType> => {
    // Check if redis client already exist
    if (redisClient) {
        return redisClient;
    }
    
    const redisUrl: string | undefined = process.env.REDIS_HOST;
    const redisPort: string | undefined = process.env.REDIS_PORT;
    const redisPassword: string | undefined = process.env.REDIS_PASSWORD;

    const clientOptions: any = {
        socket: {
            // port: parseInt(redisPort || "12317"),
            port: redisPort
        }
    };
    if (redisPassword) {
        clientOptions.password = redisPassword;
    }
    if (redisUrl) {
        clientOptions.socket.host = redisUrl;
    }

    // redisClient = createClient({
    //     password: redisPassword,
    //     socket: {
    //         host: redisUrl,
    //         port: redisPortp
    //     }
    // })

    redisClient = createClient(clientOptions);

    redisClient.on("connect", () => {
        console.log("Redis TCP connection established successfully.");
    });

    redisClient.on("ready", () => {
        console.log("Redis client is ready to use.");
    });

    redisClient.on("error", (err) => {
        console.error("Redis connection error:", err);
    });

    redisClient.on("end", () => {
        console.log("Redis connection closed.");
    });

    await redisClient.connect();
    return redisClient;
}

export const getRedisClient = (): failedResponseJson | successResponseJsonRedisCLient => {
    console.log("Getting Redis client from getRedisClient function...", redisClient);
    if (!redisClient) {
        return ({status: "FAILED", message: "Redis client is not initialized."});
    } 
    else {
        return ({status: "SUCCESS", message: "Redis client is initialized.", client: redisClient});
    }
}