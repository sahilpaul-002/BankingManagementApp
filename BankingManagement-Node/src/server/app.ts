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
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";

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
const allowedOrigins: string[] = [
    "http://localhost:3000",
]
const corsOptions: cors.CorsOptions = {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void => {
        // Allow server-to-server or Postman (no origin)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
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

// ---------------------------------------- Custom Middlewares ---------------------------------------- \\
// Dynamic Session Middleware
// app.use(dynamicSession(sessions))

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