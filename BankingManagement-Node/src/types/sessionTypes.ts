import session from "express-session";

// Session return configuration type
export interface SessionConfig {
    adminSession: session.SessionOptions;
    userSession: session.SessionOptions;
}

// Session error type
export interface SessionError {
    status: string;
    message: string;
};