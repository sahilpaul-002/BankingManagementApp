// Base Response JSON Type
export interface BaseResponse {
    // status: string;
    message: string;
}

// Error Status Value Types
export type ErrorStatus = "BAD_REQUEST" | "UNAUTHENTICATED" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_SESSION" | "INTERNAL_SERVER_ERROR" | "INVALID_HEADER" | "ERROR";

// Response Error JSON Type
export interface responseError {
    error?: unknown
}

// Response Data JSON Type
export interface responseData<T extends object = object> {
    // data?: unknown;
    data?: T;
}

// Failed Response JSON Type
export interface failedResponseJson extends BaseResponse, responseError {
    status: ErrorStatus;
} 

// Successful Response JSON Type
export interface successResponseJson extends BaseResponse, responseData { 
    status: "SUCCESS";
};