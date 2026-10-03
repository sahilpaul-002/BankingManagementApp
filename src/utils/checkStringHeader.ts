import type { Request } from "express";

const checkStringHeader = (
    headers: Request["headers"],
    name: string
): string | null => {
    const value = headers[name.toLowerCase()];

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

export default checkStringHeader;