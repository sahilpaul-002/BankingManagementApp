import type { Request } from "express";
import type { ParsedQs } from "qs";

const checkStringQueryParams = (
    query: Record<string, string> | ParsedQs | undefined,
    name: string
): string | null => {
    const value = query?.[name];

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

export default checkStringQueryParams;