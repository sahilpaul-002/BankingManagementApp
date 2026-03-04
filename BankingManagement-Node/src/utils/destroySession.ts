import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";

const destroySession = async (req: Request, res: Response): Promise<successResponseJson | failedResponseJson | void> => {
    try {
        if (!req.session) {
            return { status: "NOT_FOUND", message: "NO ACTIVE SESSION FOUND" };
        }

        const sessionId = req.sessionID;

        return await new Promise<successResponseJson | failedResponseJson>((resolve) => {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session destroy error:", err);

                    return resolve({
                        status: "INTERNAL_SERVER_ERROR",
                        message: "FAILED TO DESTROY SESSION",
                        error: err
                    });
                }

                resolve({
                    status: "SUCCESS",
                    message: "SESSION DESTROYED SUCCESSFULLY",
                    data: { sessionId }
                });
            });
        });
    }
    catch (error) {
        return { status: "INTERNAL_SERVER_ERROR", message: "DESTROY SESSION SERVICE FACING ISSUE." };
    }
}

export default destroySession;