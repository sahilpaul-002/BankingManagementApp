import { createClient, type RedisClientType } from 'redis';
import dotenv from "dotenv";

dotenv.config();

let redisClient: RedisClientType | undefined;

export const redisConfig = async (): Promise<RedisClientType> => {
    // Check if redis client already exist
    if (redisClient) {
        return redisClient;
    }
    
    const redisUrl: string | undefined = process.env.REDIS_HOST;
    const redisPortp: string | undefined = process.env.REDIS_PORT;
    const redisPassword: string | undefined = process.env.REDIS_PASSWORD;

    const clientOptions: any = {
        socket: {
            port: parseInt(redisPortp || "12317"),
        }
    };
    if (redisPassword) {
        clientOptions.password = redisPassword;
    }
    if (redisUrl) {
        clientOptions.socket.host = redisUrl;
    }

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

export const getRedisClient = (): RedisClientType => {
    if (!redisClient) {
        return ({status: "error", message: "Redis client is not initialized."} as unknown) as RedisClientType;
    } 
    else {
        return ({status: "success", message: "Redis client is initialized.", client: redisClient} as unknown) as RedisClientType;
    }
}