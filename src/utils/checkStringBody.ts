import type { Request } from "express";

const checkStringBody = (body: Request["body"], name: string): string | null => {
    const value: string | string[] | undefined = body[name];
    return typeof value === "string" ? value : null;    // Check if the header is present and if present then string
};

export default checkStringBody;