import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  Logger.info(`${req.method} ${req.path}`);
  next();
}

