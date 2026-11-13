import rateLimit from "express-rate-limit";
import { isTest } from "../config/env";
import { ErrorCode } from "../shared/error/error-codes";

function createLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMITED,
          message: "Too many request, please try again later",
        }
      })
    }
  })
}


/** Login / register: 10 attempts per 15 minutes per IP. */
export const authRateLimiter = createLimiter(15 * 60 * 1000, 10);
/** General API safety net. */
export const globalRateLimiter = createLimiter(60 * 1000, 300);