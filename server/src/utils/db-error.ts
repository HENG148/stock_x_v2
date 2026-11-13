interface PgErrorLike {
  code?: string;
  cause?: unknown
}

const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(error: unknown): boolean{
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth += 1){
    const candidate = current as PgErrorLike;
    if (candidate.code === UNIQUE_VIOLATION) return true;
    current = candidate.cause;
  }
  return false;
}