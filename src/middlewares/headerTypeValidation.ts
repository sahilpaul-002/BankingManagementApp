import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import checkStringHeader from "../utils/checkStringHeader.js";
import { request } from "node:http";
import { AppErrorClass, InvalidHeaderError } from "../utils/AppErrorClass.js";

const headerTypeValidation = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    try {
        // Validate Content-Type header for POST, PUT, PATCH requests
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
            const contentType: string | undefined = req.headers["content-type"];
            if (!contentType || !contentType.includes("application/json")) {
                throw new InvalidHeaderError("'content-type' header must be application/json")
            }
        }

        // Validate FROM_PORTAL header
        const fromPortal: string | null = checkStringHeader(req.headers, "from-portal");
        if (!fromPortal) {
            throw new InvalidHeaderError("'from-portal' MISSING OR NOT STRING")
        }

        // Validate X-API-Key header
        const xApiKey: string | null = checkStringHeader(req.headers, "x-api-key");
        if (!xApiKey) {
            throw new InvalidHeaderError("'x-api-key' MISSING OR NOT STRING")
        }

        // Validate Authorization header
        const authorizationHeader: string | null = checkStringHeader(req.headers, "authorization");
        if (!authorizationHeader) {
            throw new InvalidHeaderError("'authorization' MISSING OR NOT STRING")
        }

        // Skip user existance check for selcted pathes
        const excludedPaths: string[] = ["/signUp"];
        if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
            return next();
        }
        else {
            // Validate the device-id type header
            const devideId: string | null = checkStringHeader(req.headers, "x-device-id");
            if (!devideId) {
                throw new InvalidHeaderError("'device-id' MISSING OR NOT STRING")
            }
            // Validate Agent Code header
            const agentCode: string | null = checkStringHeader(req.headers, "agent-code")
            if (!agentCode) {
                throw new InvalidHeaderError("'agent-code' MISSING OR NOT STRING")
            }

            // Validate Subagent Code header
            const subAgentCode: string | null = checkStringHeader(req.headers, "subagent-code")
            if (!subAgentCode) {
                throw new InvalidHeaderError("'subagent-code' MISSING OR NOT STRING")
            }

            // Validate Program ID header
            const programId: string | null = checkStringHeader(req.headers, "program-id")
            if (!programId) {
                throw new InvalidHeaderError("'program-id' MISSING OR NOT STRING")
            }

            // Validate Business ID header
            const businessId: string | null = checkStringHeader(req.headers, "business-id")
            if (!businessId) {
                throw new InvalidHeaderError("'business-id' MISSING OR NOT STRING")
            }

            // Validate Client ID header
            const clientId: string | null = checkStringHeader(req.headers, "client-id")
            if (!clientId) {
                throw new InvalidHeaderError("'client-id' MISSING OR NOT STRING")
            }
        }

        next();
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("Header type validation is facing issue.")
    }
}

export default headerTypeValidation;