import "express-session";
import type { SessionItems } from "./sessionTypes.ts";

declare module "express-session" {
    interface Session {
        isNew: boolean;
    }
    interface SessionData extends SessionItems { }
}