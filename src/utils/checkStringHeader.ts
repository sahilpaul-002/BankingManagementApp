import type { Request } from "express";

const checkStringHeader = (headers: Request["headers"], name: string): string | null => {
    const value: string | string[] | undefined = headers[name.toLowerCase()];
    return typeof value === "string" ? value : null;    // Check if the header is present and if present then string
};

export default checkStringHeader;