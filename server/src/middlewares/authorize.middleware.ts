import { RequestHandler } from "express";
import { UserRole } from "../shared/constants/role";
import { AppError } from "../shared/error/app-error";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(AppError.unauthenticated());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden());
      return;
    }
    next();
  }
}