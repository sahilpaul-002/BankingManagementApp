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
export type sessionDataTypes = {
    domainName: string;
    dashboardName: string;
    baseUrl: string
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
    deviceId: string;
    userAgent?: string;
    createdAt?: number;
}

// Encryption keys for headers
type headerKeysType = {
    publicKey: string,
    privateKey: string
}

// Session items stored in session
export interface sessionItemsTypes {
    initiated: boolean;
    lastActivity: number;
    valid: boolean;
    publicKey: string;
    privateKey: string;
    encryptionKey: string;
    userEmail: string;
    userName: string
    userId?: string;
    passwordHash: string;
    userType: UserType;
    headerKeys: headerKeysType;
    sessiondata: sessionDataTypes;
    meta?: sessionMeta;
}

// // Augment express-session to include custom session fields
// declare module "express-session" {
//     interface SessionData extends sessionItemsTypes {}
// }