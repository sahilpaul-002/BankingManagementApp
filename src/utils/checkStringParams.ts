import type { Request } from "express";

const checkStringParams = (req: Request, name: string): string | null => {
    const value: string | string[] | undefined = req.params?.[name];
    return typeof value === "string" ? value : null;
};

export default checkStringParams;