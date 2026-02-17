import type { Request, Response } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";

const destroySession = (req: Request, res: Response) => {
    try {
        if (!req.session) {
            return { status: "NOT_FOUND", message: "NO ACTIVE SESSION FOUND" };
        }

        const sessionId = req.sessionID;

        req.session.destroy((err): successResponseJson | failedResponseJson => {
            if (err) {
                console.error("Session destroy error:", err);
                return { status: "INTERNAL_SERVER_ERROR", message: "FAILED TO DESTROY SESSION", error: err };
            }

            res.clearCookie("BMA_Ausiness_Session");
            res.clearCookie("BMA_Admin_Session");
            res.clearCookie("BMA_User_Session");

            return { status: "SUCCESS", message: "SESSION DESTROYED SUCCESSFULLY", data: { sessionId: sessionId } };
        });
    }
    catch (error) {
        return { status: "INTERNAL_SERVER_ERROR", message: "DESTROY SESSION SERVICE FACING ISSUE." };
    }
}

export default destroySession;