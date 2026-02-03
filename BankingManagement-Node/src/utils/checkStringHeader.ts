import type { Request } from "express";

const checkStringHeader = (req: Request, name: string): string | null => {
    const value = req.headers[name.toLowerCase()];
    return typeof value === "string" ? value : null;    // Check if the header is present and if present then string
};

export default checkStringHeader;