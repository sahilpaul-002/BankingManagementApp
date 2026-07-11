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
    m2pAllowed: boolean;
    p2pAllowed: boolean;
    adminEmail: string;
    requestXApiKey: string;
    accessToken: string;
}

// User type values
type UserType = "ADMIN" | "USER" | "MASTER_ADMIN";

// Meta information stored in session
export interface sessionMetaTypes {
    clientIp: string;
    deviceId: string;
    userAgent?: string;
    createdAt?: number;
}

export type userConfigurationTypes = {
    businessName: string;
    programType: string;
    businessId: string;
    programId: string;
    agentCode: string;
    subAgentCode: string;
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
    userConfiguration: userConfigurationTypes;
    userName: string
    userId?: string;
    passwordHash: string;
    userType: UserType;
    is2faVerified: boolean;
    headerKeys: headerKeysType;
    cardholderId?: string | null;
    walletId?: string;
    sessiondata: sessionDataTypes;
    meta?: sessionMetaTypes;
}

// // Augment express-session to include custom session fields
// declare module "express-session" {
//     interface SessionData extends sessionItemsTypes {}
// }