import type { Request } from "express";
import type {ParsedQs} from "qs";

const checkStringQueryParams = (query: Record<string, string> | ParsedQs | undefined, name: string): string | null => {
    const value = query?.[name];
    return typeof value === "string" ? value : null;
};

export default checkStringQueryParams;