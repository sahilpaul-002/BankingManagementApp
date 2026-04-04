import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rid from "connect-rid"
import cookieParser from "cookie-parser";
import timeout from "connect-timeout";
import dynamicSession from "../middlewares/dynamicSession.js";
import rateLimiter from "../middlewares/rateLimiter.js";
import sessionExistance from "../middlewares/sessionExistance.js";
import checkOriginExist from "../middlewares/checkOriginExist.js";
import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson, successResponseJsonRedisStore } from "../types/responseJson.js";
import { redisConfig } from "../configs/redisConfig.js";
import type { RedisClientType } from "redis";
import portalHeaderCheck from "../middlewares/portalHeaderCheck.js";
import sessionExpiration from "../middlewares/sessionExpiration.js";
import checkTimeout from "../middlewares/checkTimeout.js";
import morgan from "morgan";
import logger from "../utils/logger.js";
import helperRoutes from "../routes/helperRoutes.js";
import configRoutes from "../routes/configRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import headerTypeValidation from "../middlewares/headerTypeValidation.js";
import sessionValidation from "../middlewares/sessionValidation.js";
import headerValidations from "../middlewares/headerValidations.js";
import checkRequestSource from "../middlewares/checkRequestSource.js";

dotenv.config();
const ENVIRONMENT: string = process.env.NODE_ENV || "production";

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
    origin: true,
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
app.use(cookieParser(process.env.COOKIE_SECRET_KEY || "jsev4jdls6sb15h2n5lujfj8b8m8sz5gv1f2d4eg1hfs"));

// Morgon Middleware
app.use(
    // morgan("combined", {
    //     stream: {
    //         write: (message: string) => logger.info(message.trim())
    //     }
    // })

    morgan((tokens, req, res) => {
        return JSON.stringify({
            method: tokens.method?.(req, res) || "",
            url: tokens.url?.(req, res) || "",
            status: tokens.status?.(req, res) || "",
            responseTime: tokens["response-time"]?.(req, res) || "0"
        });
    }, {
        stream: {
            write: (message) => logger.info(JSON.parse(message))
        }
    })
);
// --------------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX --------------------------------------------- \\

// --------------------------------------- Redis Setup --------------------------------------- \\
// Create Redis CLient and establish connection
const redisClient: RedisClientType = await redisConfig();
app.locals.redisClient = redisClient;
// --------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\

// ---------------------------------------- Custom Middlewares ---------------------------------------- \\
// Cehck Origin Header Exist Middleware
app.use(checkOriginExist)

// Check Portal Header Exist Middleware
app.use(portalHeaderCheck);

// REQUEST SOURCE CHECK
// if (ENVIRONMENT?.toUpperCase() === "PRODUCTION") {
//     app.use(checkRequestSource);
// }
app.use(checkRequestSource);

// Dynamic Session Middleware
app.use(dynamicSession())

// Rate Limiter Middleware
app.use(rateLimiter());

// Check session existance  middleware 
app.use(sessionExistance);
// ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\

// ---------------------------------------- Routes ---------------------------------------- \\
app.use("/api/v1/helper", checkTimeout(5), helperRoutes);
app.use("/api/v1/config", checkTimeout(5), configRoutes);
app.use("/api/v1/user", headerTypeValidation, headerValidations, checkTimeout(5), userRoutes);
// --------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\


export default app;