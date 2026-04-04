import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson } from "../types/responseJson.js";
import checkStringHeader from "../utils/checkStringHeader.js";
import { request } from "node:http";

const headerTypeValidation = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Validate Content-Type header for POST, PUT, PATCH requests
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const contentType: string | undefined = req.headers["content-type"];
        if (!contentType || !contentType.includes("application/json")) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'content-type' header must be application/json" });
        }
    }

    // Validate FROM_PORTAL header
    const fromPortal: string | null = checkStringHeader(req, "from-portal");
    if (!fromPortal) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'from-portal' MISSING OR NOT STRING" });
    }

    // Validate X-API-Key header
    const xApiKey: string | null = checkStringHeader(req, "x-api-key");
    if (!xApiKey) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'x-api-key' MISSING OR NOT STRING" });
    }

    // Validate Authorization header
    const authorizationHeader: string | null = checkStringHeader(req, "authorization");
    if (!authorizationHeader) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'authorization' MISSING OR NOT STRING" });
    }

    // Skip user existance check for selcted pathes
    const excludedPaths: string[] = ["/api/v1/user/signUp"];
    if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
        return next();
    }
    else {
        // Validate Agent Code header
        const agentCode: string | null = checkStringHeader(req, "agent-code")
        if (!agentCode) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'agent-code' MISSING OR NOT STRING" });
        }

        // Validate Subagent Code header
        const subAgentCode: string | null = checkStringHeader(req, "subagent-code")
        if (!subAgentCode) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'subagent-code' MISSING OR NOT STRING" });
        }

        // Validate Program ID header
        const programId: string | null = checkStringHeader(req, "program-id")
        if (!programId) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'program-id' MISSING OR NOT STRING" });
        }

        // Validate Business ID header
        const businessId: string | null = checkStringHeader(req, "business-id")
        if (!businessId) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'business-id' MISSING OR NOT STRING" });
        }

        // Validate Client ID header
        const clientId: string | null = checkStringHeader(req, "client-id")
        if (!clientId) {
            return res.status(400).json({ status: "INVALID_HEADER", message: "'client-id' MISSING OR NOT STRING" });
        }
    }

    next();
}

export default headerTypeValidation;