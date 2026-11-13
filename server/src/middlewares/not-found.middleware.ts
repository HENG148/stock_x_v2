import { RequestHandler } from "express";
import { AppError } from "../shared/error/app-error";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.path} not found`));
}