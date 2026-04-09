import type { errorStatusTypes } from "../types/responseJson.js";

export class AppErrorClass extends Error {
    public statusCode: number;
    public status: errorStatusTypes;
    public error?: any;
    public isOperational: boolean;

    constructor(statusCode: number, status: errorStatusTypes, message: string, error?: any) {
        super(message);

        this.statusCode = statusCode;
        this.status = status;
        this.error = error instanceof Error ? error.message : error;
        this.isOperational = true;

        Object.setPrototypeOf(this, AppErrorClass.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}