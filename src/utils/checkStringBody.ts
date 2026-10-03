import type { Request } from "express";

const checkStringBody = (
    body: Request["body"],
    name: string
): string | null => {
    const value = body?.[name];

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

export default checkStringBody;