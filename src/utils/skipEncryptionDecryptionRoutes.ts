import type { Request } from "express";

export const skipEncryptionDecryptionRoutes = (req: Request): boolean => {
    const url = req.originalUrl || req.url;

    return (
        url?.includes("/helper") ||
        url?.includes("/getDnsConfig") ||
        url?.includes('/getEncryptionKey') ||
        url?.includes('/getPublicKey') ||
        url?.includes('/getHeaderPublicKey')
    );
};