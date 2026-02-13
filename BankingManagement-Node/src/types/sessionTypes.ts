import session from "express-session";

// Session return configuration type
export interface SessionConfig {
    businessSession: session.SessionOptions,
    adminSession: session.SessionOptions;
    userSession: session.SessionOptions;
}

// Session error type
export interface SessionError {
    status: string;
    message: string;
};

// Sessiondata stored in session
type sessiondata = {
    requestXApiKey: string;
    agentCode: string;
    subAgentCode: string;
    programId: string;
    clientId: string;
    clientName: string;
    accessToken: string;
}

// User Type Value TYpes
type userType = "ADMIN" | "USER" | "SUPERADMIN";

// Session Items stored in session
export interface SessionItems {
    initiated: boolean;
    lastActivity: number;
    valid: boolean;
    publicKey: string;
    privateKey: string;
    encryptionKey: string,
    userEmail: string;
    passwordHash: string;
    userType: userType;
    sessiondata: sessiondata;
}