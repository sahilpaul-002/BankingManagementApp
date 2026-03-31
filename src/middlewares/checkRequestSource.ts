import type { Request, Response, NextFunction } from 'express';
import type { failedResponseJson } from '../types/responseJson.js';
import normalizeIp from '../utils/normalizeIp.js';

const checkRequestSource = (req: Request, res: Response, next: NextFunction): Response<failedResponseJson> | void => {
    // ------------------------ Logic to check request headers ------------------------ \\
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
        res.status(400).json({
            status: "UNAUTHORIZED",
            message: "User is not allowed to access the application",
        });
        return;
    }
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

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

    if (req.session.meta?.clientIp !== clientIp) {
        res.status(400).json({ status: "FORBIDDEN", message: "Forbidden session" });
        return;
    }
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    // ----------------------------- Logic to check request domain ----------------------------- \\
    // Check client domain matches the session domain
    if (!req.session?.sessiondata?.domainName) {
        res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthenticated session" });
        return;
    }

    let origin: string | undefined = req.headers.origin || req.headers.referer;

    if (origin?.includes("localhost")) {
        origin = `https://${req.session.sessiondata.domainName}`;
    }

    const sessionDomain: string = req.session.sessiondata.domainName;

    if (origin && sessionDomain) {
        try {
            const originHost: string = new URL(origin).hostname;

            if (originHost !== sessionDomain && !originHost.endsWith(`.${sessionDomain}`)) {
                res.status(400).json({ status: "FORBIDDEN", message: "Forbidden session" });
                return;
            }
        } catch {
            res.status(400).json({ status: "FORBIDDEN", message: "Forbidden session" });
            return;
        }
    }
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------- \\

    next();
};

export default checkRequestSource;