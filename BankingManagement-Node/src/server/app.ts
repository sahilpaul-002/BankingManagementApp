import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rid from "connect-rid"
import cookieParser from "cookie-parser";

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


export default app;