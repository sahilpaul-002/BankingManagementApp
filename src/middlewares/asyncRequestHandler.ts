import type { Request, Response, NextFunction } from "express";

type RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => unknown;

const asyncRequestHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(next);
  } catch (error) {
    next(error);
  }
}

export default asyncRequestHandler;