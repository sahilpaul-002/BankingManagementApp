// import session from "express-session";

// // Session return configuration type
// export interface SessionConfig {
//     businessSession: session.SessionOptions,
//     adminSession: session.SessionOptions;
//     userSession: session.SessionOptions;
// }

// // Session error type
// export interface SessionError {
//     status: string;
//     message: string;
// };

// // Sessiondata stored in session
// export type sessiondata = {
//     domainName: string;
//     agentCode: string;
//     subAgentCode: string;
//     businessId: string;
//     programId: string;
//     clientId: string;
//     requestXApiKey: string;
//     accessToken: string;
// }

// // User Type Value TYpes
// type userType = "ADMIN" | "USER" | "SUPERADMIN";

// // Session Items stored in session
// export interface SessionItems {
//     initiated: boolean;
//     lastActivity: number;
//     valid: boolean;
//     publicKey: string;
//     privateKey: string;
//     encryptionKey: string,
//     userEmail: string;
//     userId?: string;
//     passwordHash: string;
//     userType: userType;
//     sessiondata: sessiondata;
// }
import session from "express-session";

// Session return configuration type
export interface sessionConfig {
    businessSession: session.SessionOptions;
    adminSession: session.SessionOptions;
    userSession: session.SessionOptions;
}

// Session error type
export interface sessionError {
    status: string;
    message: string;
}

// Session data stored in session
export type sessionData = {
    domainName: string;
    agentCode: string;
    subAgentCode: string;
    businessId: string;
    programId: string;
    clientId: string;
    requestXApiKey: string;
    accessToken: string;
}

// User type values
type UserType = "ADMIN" | "USER" | "SUPERADMIN";

// Meta information stored in session
export interface sessionMeta {
    clientIp: string;
    userAgent?: string;
    createdAt?: number;
    key: string;
}

// Session items stored in session
export interface sessionItems {
    initiated: boolean;
    lastActivity: number;
    valid: boolean;
    publicKey: string;
    privateKey: string;
    encryptionKey: string;
    userEmail: string;
    userId?: string;
    passwordHash: string;
    userType: UserType;
    sessiondata: sessionData;
    meta?: sessionMeta;
}

// Augment express-session to include custom session fields
declare module "express-session" {
    interface SessionData extends sessionItems {}
}