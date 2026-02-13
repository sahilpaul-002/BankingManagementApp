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
import portalHeaderCheck from "../middlewares/portalHeckCheck.js";
import helperRoutes from "../routes/helperRoutes.js";
import configRoutes from "../routes/configRoutes.js";
import sessionExpiration from "../middlewares/sessionExpiration.js";

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
// --------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\

// ---------------------------------------- Custom Middlewares ---------------------------------------- \\
// Cehck Origin Header Exist Middleware
app.use(checkOriginExist)

// Check Portal Header Exist Middleware
app.use(portalHeaderCheck);

// Dynamic Session Middleware
app.use(dynamicSession())

// Rate Limiter Middleware
app.use(rateLimiter());

// Check session existance  middleware 
app.use(sessionExistance);
// ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\

// ---------------------------------------- Routes ---------------------------------------- \\
app.use("/api/v1/helper", helperRoutes);
app.use("/api/v1/config", configRoutes);
// --------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\


export default app;