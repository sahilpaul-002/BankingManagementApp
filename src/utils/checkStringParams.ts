import type { Request } from "express";

const checkStringParams = (req: Request, name: string): string | null => {
    const value = req.params?.[name];

    if (typeof value !== "string") {
        return null;
    }

    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLowerCase();

    if (
        normalizedValue === "" ||
        normalizedValue === '""' ||
        normalizedValue === "undefined" ||
        normalizedValue === '"undefined"' ||
        normalizedValue === "null" ||
        normalizedValue === '"null"'
    ) {
        return null;
    }

    return trimmedValue;
};

export default checkStringParams;