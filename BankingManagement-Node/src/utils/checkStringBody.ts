import type { Request } from "express";

const checkStringBody = (req: Request, name: string): string | null => {
    const value: string | string[] | undefined = req.headers[name.toLowerCase()];
    return typeof value === "string" ? value : null;    // Check if the header is present and if present then string
};

export default checkStringBody;