import "express-session";
import type { sessionItemsTypes } from "./sessionTypes.ts";

declare module "express-session" {
    interface Session {
        isNew: boolean;
    }
    interface SessionData extends sessionItemsTypes { }
}