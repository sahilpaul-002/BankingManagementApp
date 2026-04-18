import type { Request } from "express";
import type {ParsedQs} from "qs";

const checkStringQueryParams = (query: Record<string, string> | ParsedQs | undefined, name: string): string | null => {
    const value = query?.[name];

    if (typeof value === "string") {
        return value.toLowerCase();
    }

    return null;
};

export default checkStringQueryParams;