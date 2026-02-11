import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rid from "connect-rid"
import cookieParser from "cookie-parser";
import dynamicSession from "../middlewares/dynamicSession.js";
import rateLimiter from "../middlewares/rateLimiter.js";
import sessionExistance from "../middlewares/sessionExistance.js";
import checkOriginExist from "../middlewares/checkOriginExist.js";
import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson, successResponseJsonRedisStore } from "../types/responseJson.js";
import { redisConfig } from "../configs/redisConfig.js";
import type { RedisClientType } from "redis";
import getRedisStore from "../configs/redisStore.js";
import buildSession from "../middlewares/buildSession.js";

dotenv.config();

// ---------------------------------------- Initialize Express Application --------------------------------------- \\
const app: express.Application = express();
// --------------------------------------------- XXXXXXXXXXXXXXXXXXXXXX --------------------------------------------- \\

// -------------------------------- Configure Default Middlewares -------------------------------- \\
// Express Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// CORS Middleware
const corsOptions: cors.CorsOptions = {
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
};

app.use(cors(corsOptions));

// Helmet Middleware
app.use(helmet());

// Unique Request ID Middleware
app.use(rid());

// Cookie Parser Middleware
app.use(cookieParser());
// --------------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX --------------------------------------------- \\

// --------------------------------------- Redis Setup --------------------------------------- \\
// Create Redis CLient and establish connection
const redisClient: RedisClientType = await redisConfig();
app.locals.redisClient = redisClient;
// // Create Redis Store
// const redisStoreResponse: successResponseJsonRedisStore | failedResponseJson = await getRedisStore(redisClient);
// let sessions
// if (redisStoreResponse.status === "SUCCESS" && redisStoreResponse.store) {
//     app.locals.redisStore = redisStoreResponse.store;
//     sessions = buildSession(redisStoreResponse.store);
//     console.log("Redis store created and stored in app.locals successfully.");
// }
// else {
//     console.error("Failed to create Redis store:", redisStoreResponse.message);
// }
// --------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\

// ---------------------------------------- Custom Middlewares ---------------------------------------- \\
// Dynamic Session Middleware
app.use(dynamicSession())

// Rate Limiter Middleware
app.use(rateLimiter());

// Check session existance  middleware 
app.use(sessionExistance);

// Cehck Origin Header Exist Middleware
app.use(checkOriginExist)
// ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\

// ---------------------------------------- Default Routes ---------------------------------------- \\

// Health Check Route
app.get("/health", (req: Request, res: Response): Response<successResponseJson> => {
    return res.status(200).json({ status: "OK", message: "SERVER IS HEALTHY" });
})

// Get Session
app.get("/get-session", (req: Request, res: Response): Response<successResponseJson> => {
    if (!req.session) {
        return res.status(200).json({ status: "SUCCESS", message: "NO ACTIVE SESSION FOUND" });
    }

    const sessionId = req.sessionID;
    return res.status(200).json({ status: "SUCCESS", message: "SESSION FOUND", data: { session: req.session, sessionId: sessionId } })
});

// Destroy Session
app.get("/destroy-session", (req: Request, res: Response): Response<successResponseJson> | Response<failedResponseJson> | void => {
    if (!req.session) {
        return res.status(200).json({ status: "SUCCESS", message: "NO ACTIVE SESSION FOUND" });
    }

    const sessionId = req.sessionID;

    req.session.destroy((err): Response<successResponseJson> | Response<failedResponseJson> => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "FAILED TO DESTROY SESSION", error: err });
        }

        res.clearCookie("connect.sid.admin");
        res.clearCookie("connect.sid.user");

        return res.json({status: "SUCCESS", message: "SESSION DESTROYED SUCCESSFULLY", data: {sessionId: sessionId}});
    });
});
// ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\


export default app;