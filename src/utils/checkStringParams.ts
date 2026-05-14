import type { Request } from "express";

const checkStringParams = (req: Request, name: string): string | null => {
    const value = req.params?.[name];

    if (typeof value === "string") {
        return value;
    }

    return null;
};

export default checkStringParams;