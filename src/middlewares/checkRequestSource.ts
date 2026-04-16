import type { Request, Response, NextFunction } from 'express';
import type { failedResponseJson } from '../types/responseJson.js';
import normalizeIp from '../utils/normalizeIp.js';
import dotenv from "dotenv";
import { AppErrorClass } from '../utils/AppErrorClass.js';

dotenv.config();
const ENVIRONMENT: string = process.env.NODE_ENV || "production";

const checkRequestSource = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {

    // ------------------------ Logic to check request headers ------------------------ \\
    try {
        if (ENVIRONMENT?.toUpperCase() === "PRODUCTION") {
            const ua: string = req.headers['user-agent'] || '';
            const chUA: string | string[] = req.headers['sec-ch-ua'] || '';

            const isValidUA: boolean = ["Mozilla", "AppleWebKit", "Chrome", "Safari", "Edg"]
                .some((val: string) => ua.includes(val));

            const isValidClientHint: boolean = ["Chromium", "Google Chrome", "Microsoft Edge", "Not-A.Brand"]
                .some((val: string) => chUA.includes(val));

            const hasSecFetch: boolean = !!req.headers['sec-fetch-site'];

            const isLikelyBrowser: boolean =
                isValidUA &&
                hasSecFetch &&
                isValidClientHint;

            if (!isLikelyBrowser) {
                throw new AppErrorClass(
                    400,
                    "FORBIDDEN",
                    "User is not allowed to access the application"
                )
            }
        }
    }
    catch (error) {
        if (error instanceof AppErrorClass) {
            throw error; // ✅ preserve original error
        }
        throw new Error("Request source header validation is facing issue.")
    }
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    const excludedPaths1: string[] = ["/api/v1/helper", "/api/v1/config", "/api/v1/user/signUp", "/api/v1/user/login"];
    if (excludedPaths1.some(path => req.path === path || req.path.startsWith(path + "/"))) {
        return next();
    }
    else {
        // ----------------------------- Logic to check request domain ----------------------------- \\
        try {
            // Check client domain matches the session domain
            if (!req?.session?.sessiondata?.domainName) {
                throw new AppErrorClass(
                    400,
                    "UNAUTHENTICATED",
                    "Unauthenticated session"
                );
            }

            let origin: string | undefined = req.headers.origin || req.headers.referer;

            if (origin?.includes("localhost")) {
                origin = `https://${req.session.sessiondata.domainName}`;
            }

            const sessionDomain: string = req?.session?.sessiondata?.domainName;

            if (origin && sessionDomain) {
                const originHost: string = new URL(origin).hostname;

                if (originHost !== sessionDomain && !originHost.endsWith(`.${sessionDomain}`)) {
                    throw new AppErrorClass(
                        400,
                        "UNAUTHENTICATED",
                        "Unauthenticated session"
                    );
                }
                // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------- \\

                // ------------------------------- Logic to check request ip ------------------------------- \\
                const getClientIP = (req: Request): string | null => {
                    const ip: string | undefined =
                        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
                        req.socket?.remoteAddress ||
                        (req as any).connection?.remoteAddress ||
                        req.ip;

                    return normalizeIp(ip);
                };

                const clientIp: string | null = getClientIP(req);

                if (req?.session?.meta?.clientIp !== clientIp) {
                    throw new AppErrorClass(
                        400,
                        "UNAUTHENTICATED",
                        "Unauthenticated session"
                    );
                }
                // ------------------------------- XXXXXXXXXXXXXXXXXXXXX ------------------------------- \\
            }
        }
        catch (error) {
            if (error instanceof AppErrorClass) {
                throw error; // ✅ preserve original error
            }
            throw new Error("Request source domain validation is facing issue.")
        }
    }

    next();
};

export default checkRequestSource;