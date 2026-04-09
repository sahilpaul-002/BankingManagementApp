import type { Request, Response, ErrorRequestHandler } from "express"
import logger from "./logger.js";
import type { failedResponseJson } from "../types/responseJson.js";
import { logError } from "./loggerWrappper.js";

const errorHandler = (req: Request, res: Response, error: any, statusCode: number, status: string, message: string): Response<failedResponseJson> | void => {
    // logger.error({
    //     message: error.message,
    //     stack: error.stack,
    //     url: req.path,
    //     method: req.method
    // });
    logError(req, error);

    if (!res.headersSent) {
        res.status(statusCode).json({status: status, message: message, error: error});
    }
}

export default errorHandler