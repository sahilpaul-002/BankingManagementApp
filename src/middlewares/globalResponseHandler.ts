// src/middleware/responseHandler.ts

import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import type { errorStatusTypes } from "../types/responseJson.js";
import { logWarn } from "../utils/loggerWrappper.js";

declare module "express-serve-static-core" {
    interface Response {
        success: <T>(message: string, data: T, statusCode?: number) => Response;
        fail: (status: errorStatusTypes, message: string, statusCode?: number, error?: any) => Response;
    }
}

const globalResponseHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    res.success = function <T>(message = "SUCCESS", data: T, statusCode = 200) {
        // Prevet response already sent error
        if (res.headersSent) {
            return res;
        }

        return res.status(statusCode).json({
            status: "SUCCESS",
            message,
            data,
        });
    };

    res.fail = function (
        status: errorStatusTypes,
        message: string,
        statusCode = 400,
        error: any
    ) {
        // Prevet response already sent error
        if (res.headersSent) {
            return res;
        }
        
        // 🔥 Log before sending response
        // logger.warn({
        //     status,
        //     message,
        //     url: req.path,
        //     method: req.method,
        // });
        logWarn(req, status, message);

        return res.status(statusCode).json({
            status,
            message,
            error
        });
    };

    next();
};

export default globalResponseHandler;