import type { Request } from "express";

const checkStringQueryParams = (req: Request, name: string): string | null => {
    const value = req.query?.[name];

    if (typeof value === "string") {
        return value.toLowerCase();
    }

    return null;
};

export default checkStringQueryParams;