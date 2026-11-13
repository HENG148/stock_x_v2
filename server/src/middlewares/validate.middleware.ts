import { RequestHandler } from "express";
import { ZodType } from "zod";
import { AppError, ErrorDetail } from "../shared/error/app-error";

interface ValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidationSchema): RequestHandler {
  return (req, _res, next) => {
    const details: ErrorDetail[] = [];
    const validated: NonNullable<typeof req.validated> = {};

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (result.success) {
        validated[key] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ path: [key, ...issue.path].join("."), message: issue.message });
        }
      }
    }

    if (details.length > 0) {
      next(AppError.badRequest("Request validation failed", details));
      return;
    }
    req.validated = validated;
    next();
  }
}