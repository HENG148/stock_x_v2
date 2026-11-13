import { ErrorRequestHandler } from "express";
import { AppError } from "../shared/error/app-error";
import { ErrorCode } from "../shared/error/error-codes";
import { logger } from "../config/logger";
import { isProduction } from "../config/env";

interface HttpLikeError {
  status?: number;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
    return;
  }

  const httpErr = err as HttpLikeError;
  if (httpErr.type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      error: { code: ErrorCode.VALIDATION_ERROR, message: "Malformed JSON body" }
    });
    return;
  }
  if (httpErr.type === "entity.too.large") {
    res.status(413).json({
      success: false,
      error: { code: ErrorCode.VALIDATION_ERROR, message: "Request body too large" }
    });
    return;
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: isProduction
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Internal server error"
    }
  })
};