import { RequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../shared/error/app-error";
import { authService,} from "../modules/service/auth.service";

/** Resolves the session cookie into req.user. Authentication only; no role checks here. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token: unknown = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (typeof token !== "string" || token.length === 0) {
      throw AppError.unauthenticated();
    }
    const user = await authService.getUserFromSessionToken(token);
    if (!user) throw AppError.unauthenticated("Session is invalid or expired");
    req.user = user;
    next()
  } catch (err) {
    next(err);
  }
}