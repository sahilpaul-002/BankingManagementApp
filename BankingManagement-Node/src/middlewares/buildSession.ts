import dotenv from "dotenv";
import type { Request, RequestHandler } from "express";
import type { SessionConfig, SessionError } from "../types/sessionTypes.js";

dotenv.config();

// const buildSession = (store): session.SessionOptions => {
const buildSession = (): RequestHandler => (req: Request): SessionConfig | SessionError => {
    // if (!store) {
    //     return {status: "BAD_REQUEST", message: "Redis store id not initialised"};
    // }

    // Load environment variable
    const environment: string | undefined = process.env.NODE_ENV || "production";

    // Return session configuration options for admin and user
    return {
        adminSession: {
            // store,
            genid: (req) => {
                return crypto.randomUUID();
            },
            name: "BMA_Admin_Session",
            secret: process.env.SESSION_SECRET_KEY || "gr45fe612rfgew3grfewAfgd5a6fWvdeRT",
            resave: false,
            proxy: environment === "production", // Trust the reverse proxy when in production
            saveUninitialized: false,
            cookie: {
                httpOnly: true,

                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

                maxAge: 1000 * 60 * 10, // 10 minutes
            }
        },
        userSession: {
            // store,
            genid: (req) => {
                return crypto.randomUUID();
            },
            name: "BMA_User_Session",
            secret: process.env.SESSION_SECRET_KEY || "gr45fe612rfgew3grfewAfgd5a6fWvdeRT",
            resave: false,
            proxy: environment === "production", // Trust the reverse proxy when in production
            saveUninitialized: false,
            cookie: {
                httpOnly: true,

                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

                maxAge: 1000 * 60 * 10, // 10 minutes
            }
        }
    }
};

export default buildSession;