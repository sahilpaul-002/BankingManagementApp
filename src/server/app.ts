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
import { redisConfig } from "../configs/redisConfig.js";
import type { RedisClientType } from "redis";
import portalHeaderCheck from "../middlewares/portalHeaderCheck.js";
import sessionExpiration from "../middlewares/sessionExpiration.js";
import checkTimeout from "../middlewares/checkTimeout.js";
import morgan from "morgan";
import multer from "multer";
import logger from "../utils/logger.js";
import headerTypeValidation from "../middlewares/headerTypeValidation.js";
import sessionValidation from "../middlewares/sessionValidation.js";
import headerValidations from "../middlewares/headerValidations.js";
import checkRequestSource from "../middlewares/checkRequestSource.js";
import globalResponseHandler from "../middlewares/globalResponseHandler.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";
import validateUniqueRequests from "../middlewares/validateUniqueRequests.js";
import { requestContextMiddleware } from "../middlewares/requestContextMiddleware.js";
import asyncRequestHandler from "../middlewares/asyncRequestHandler.js";
import decryptRequestPayload from "../middlewares/decryptRequestPayload.js";
import encryptResponseData from "../middlewares/encryptedResponseData.js";
import jwtAuthTokenValidation from "../utils/jwtAuthTokenValidation.js";
import { checkDatabaseConnection } from "../middlewares/databaseConnectionCheck.js";

// IMPORTS ROUTES
import helperRoutes from "../routes/helperRoutes.js";
import configRoutes from "../routes/configRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import twoFaRoutes from "../routes/twoFaRoutes.js";
import kycRoutes from "../routes/kycRoutes.js";
import cardholderRoutes from "../routes/cardholderRoutes.js";
import walletRoutes from "../routes/walletRoutes.js";
import publicRoutes from "../routes/publicRoutes.js";
import cardRoutes from "../routes/cardRoutes.js";

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

// ---------------------------------------- Public Routes ---------------------------------------- \\
app.use((req, res, next) => {
    const skipRoutes = [
        '/favicon.ico',
    ]

    if (skipRoutes.includes(req.path)) {
        return res.status(204).end()
    }

    next()
})
app.use("/api/v1/public", publicRoutes);
// ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\

// ---------------------------------------- Custom Middlewares ---------------------------------------- \\
// Dynamic Session Middleware
app.use(dynamicSession())

// Check session existance  middleware 
app.use(sessionExistance);

// Check Database Connection
app.use(checkDatabaseConnection);

// Check Origin Header Exist Middleware
app.use(asyncRequestHandler(checkOriginExist))

// Check Portal Header Exist Middleware
app.use(asyncRequestHandler(portalHeaderCheck));

// Request Source Check
app.use(asyncRequestHandler(checkRequestSource));

app.use(asyncRequestHandler(sessionExpiration));

// Rate Limiter Middleware
app.use(rateLimiter());

// ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\
app.use((req, res, next) => {
    console.log("Path:", req.path)
    console.log("Method:", req.method);
    console.log("Query:", req.query);
    console.log("Body:", req.body);
    next();
});
// ------------------------- \\
// Decrypt Request Payload Middleware
// ------------------------- \\
app.use(decryptRequestPayload);

// ------------------------- \\
// Encrypt Response Data Middleware
// ------------------------- \\
app.use(encryptResponseData);

// ------------------------- \\
// Custom Response Handler
// ------------------------- \\
app.use(globalResponseHandler);

// ---------------------------------------- Routes ---------------------------------------- \\
app.use("/api/v1/helper", checkTimeout(5), helperRoutes);
app.use("/api/v1/config", checkTimeout(5), configRoutes);
app.use("/api/v1/user", headerTypeValidation, headerValidations, sessionValidation, validateUniqueRequests, checkTimeout(5), asyncRequestHandler(requestContextMiddleware), userRoutes);
app.use("/api/v1/twoFa", headerTypeValidation, headerValidations, sessionValidation, validateUniqueRequests, checkTimeout(5), asyncRequestHandler(requestContextMiddleware), twoFaRoutes);
app.use("/api/v1/kyc", headerTypeValidation, headerValidations, sessionValidation, validateUniqueRequests, jwtAuthTokenValidation, checkTimeout(5), asyncRequestHandler(requestContextMiddleware), kycRoutes);
app.use("/api/v1/cardholder", headerTypeValidation, headerValidations, sessionValidation, validateUniqueRequests, jwtAuthTokenValidation, checkTimeout(5), asyncRequestHandler(requestContextMiddleware), cardholderRoutes);
app.use("/api/v1/wallet", headerTypeValidation, headerValidations, sessionValidation, validateUniqueRequests, jwtAuthTokenValidation, checkTimeout(5), asyncRequestHandler(requestContextMiddleware), walletRoutes);
app.use("/api/v1/card", headerTypeValidation, headerValidations, sessionValidation, validateUniqueRequests, jwtAuthTokenValidation, checkTimeout(5), asyncRequestHandler(requestContextMiddleware), cardRoutes);
// --------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\

// ------------------------- \\
// Custom Error Handler
// ------------------------- \\
app.use(globalErrorHandler);


export default app;