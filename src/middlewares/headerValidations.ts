import type { Request, Response, NextFunction } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import extractJwtTokenValue from "../utils/extractJwtTokenValue.js";
import cookieParser from "cookie-parser";

const headerValidations = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // Validate X-API-KEY header
    const xApiKey: string = req.headers["x-api-key"] as string;

    if (xApiKey !== req.session?.sessiondata?.requestXApiKey) {
        return res.status(400).json({ status: "UNAUTHORIZED", message: "INVALID 'x-api-key'" })
    }

    // ----------------------------------- Logic to validate authorization header ----------------------------------- \\
    // Validate Authorization header
    const authorizationHeader = req.headers["authorization"] as string;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'authorization' header missing or not in Bearer token format" });
    }
    if (!authorizationHeader.split(" ")[1]) {
        return res.status(400).json({ status: "INVALID_HEADER", message: "'authorization' header missing token" });
    }
    // Extract access token
    const authorizationHeaderToken: string = authorizationHeader.split(" ")[1] as string;
    // Check if authorization header matches the signed access tooken in cookie
    const unsignedAuthorizationHeaderToken: string | boolean = cookieParser.signedCookie(authorizationHeaderToken, process.env.COOKIE_SECRET_KEY || "jsev4jdls6sb15h2n5lujfj8b8m8sz5gv1f2d4eg1hfs")
    // console.log(unsignedAuthorizationHeaderToken);
    if (unsignedAuthorizationHeaderToken && (unsignedAuthorizationHeaderToken !== req.signedCookies?.accessToken && req.session?.sessiondata?.accessToken)) {
        return res.status(400).json({ status: "UNAUTHORIZED", message: "Invalid authorization token" });
    }
    // Extract token value of authorization header access token
    const jwtTokenVerificationResult1: successResponseJson = extractJwtTokenValue(unsignedAuthorizationHeaderToken as string);
    if (jwtTokenVerificationResult1.status !== "SUCCESS") {
        return res.status(400).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to extract JWT token value from authorization header" });
    }
    const jwtAccessTokenValue1: string | undefined = (jwtTokenVerificationResult1.data as { jwtTokenValue?: string })?.jwtTokenValue;

    // Extract token value of sessiondata access token
    const jwtTokenVerificationResult2: successResponseJson = extractJwtTokenValue(req.session?.sessiondata?.accessToken as string);
    if (jwtTokenVerificationResult2.status !== "SUCCESS") {
        return res.status(400).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to extract JWT token value from sessiondata access token" });
    }
    const jwtAccessTokenValue2: string | undefined = (jwtTokenVerificationResult2.data as { jwtTokenValue?: string })?.jwtTokenValue;
    if (!jwtAccessTokenValue1 || !jwtAccessTokenValue2 || jwtAccessTokenValue1 !== jwtAccessTokenValue2) {
        return res.status(400).json({ status: "UNAUTHORIZED", message: "Invalid or expired access token" });
    }
    // -------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX -------------------------------------- \\

    // Skip user existance check for selcted pathes
    const excludedPaths: string[] = ["/api/v1/user/signUp"];
    if (excludedPaths.includes(req.originalUrl)) {
        return next();
    }
    else {
        // Validate Agent Code header
        const agentCode: string = req.headers["agent-code"] as string;
        if (agentCode !== req.session?.sessiondata?.agentCode) {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "INVALID 'agent-code'" })
        }

        // Validate Subagent Code header
        const subAgentCode: string = req.headers["subagent-code"] as string;
        if (subAgentCode !== req.session?.sessiondata?.subAgentCode) {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "INVALID 'subagent-code'" })
        }

        // Validate Program Id header
        const programId: string = req.headers["program-id"] as string;
        if (programId !== req.session?.sessiondata?.programId) {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "INVALID 'program-id'" })
        }

        // Validate Business Id header
        const businessId: string = req.headers["business-id"] as string;
        if (businessId !== req.session?.sessiondata?.businessId) {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "INVALID 'business-id'" })
        }

        // Validate Client Id header
        const clientId: string = req.headers["client-id"] as string;
        if (clientId !== req.session?.sessiondata?.clientId) {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "INVALID 'client-id'" })
        }
    }

    next();
}

export default headerValidations;