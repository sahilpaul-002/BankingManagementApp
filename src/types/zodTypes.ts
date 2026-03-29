import type { ZodError } from "zod";

export type SafeParseResult<T> = { success: true; data: T} | { success: false; error: ZodError<T>};