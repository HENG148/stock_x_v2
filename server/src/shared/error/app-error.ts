import { ErrorCode } from "./error-codes";

export interface ErrorDetail {
  path: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }
  static unauthenticated(message = "Authentication required"): AppError {
    return new AppError(401, ErrorCode.UNAUTHENTICATED, message);
  }
  static invalidCredentials(): AppError {
    return new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
  }
  static forbidden(message = "You do not have permission to perform this action"): AppError {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }
  static notFound(message = "Resource not found"): AppError{
    return new AppError(404, ErrorCode.NOT_FOUND, message);
  }
  static conflict(message: string): AppError {
    return new AppError(409, ErrorCode.CONFLICT, message);
  }
}