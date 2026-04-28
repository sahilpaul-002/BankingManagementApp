import type { Request, Response, NextFunction } from "express";

const sessionExistance = (req: Request, res: Response, next: NextFunction): void => {
    if (req.session) {
        console.log("Session exists with session-ID: ", req.sessionID);
        console.log("Session exists with session: ", req.session);
    }
    else {
        console.log("Session does not exist.");
    }

    next();
}

export default sessionExistance;