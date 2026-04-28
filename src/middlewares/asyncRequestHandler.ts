import type { Request, Response, NextFunction } from "express";

const asyncRequestHandler = (fn: any) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default asyncRequestHandler;