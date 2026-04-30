import type { RedisClientType } from "redis";
import type { RedisStore } from "connect-redis";

// Base Response JSON Type
export interface baseResponseTypes {
    status: string;
    message: string;
}

// Error Status Value Types
export type errorStatusTypes = "BAD_REQUEST" | "UNAUTHENTICATED" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_SESSION" | "INTERNAL_SERVER_ERROR" | "INVALID_HEADER" | "INVALID_REQUEST_BODY_PARAMETER"  | "INVALID_REQUEST_QUERY_PARAMETER" | "SERVICE_ERROR" | "SERVICE_UNAVAILABLE" | "SERVICE_TIMEOUT"
// 400 | 401 | 401 | 403 | 404 | 401 | 500 | 406 | 406 | 406 | 400 | 503 | 429

// Response Error JSON Type
export interface responseErrorTypes {
    error?: unknown
}

// Response Data JSON Type
// export interface responseData<T extends object | string = object> {
export interface responseData<T = object | string> {
    // data?: unknown;
    data?: T;
}

// Failed Response JSON Type
export interface failedResponseJson extends baseResponseTypes, responseErrorTypes {
    status: errorStatusTypes;
} 

// Successful Response JSON Type
export interface successResponseJson extends baseResponseTypes, responseData { 
    status: "SUCCESS";
};

// Success Respnose JSON Type for Redis CLient
export interface successResponseJsonRedisCLient extends baseResponseTypes {
    status: "SUCCESS",
    client: RedisClientType
}

// Success Response JSON Type for Redis Store
export interface successResponseJsonRedisStore extends baseResponseTypes {
    status: "SUCCESS",
    store: RedisStore
}