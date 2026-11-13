import { AuthUser } from "../../types/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      }
    }
  }
}

export { };