interface PgErrorLike {
  code?: string;
  cause?: unknown
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = '23503'

function hasPgCode(error: unknown, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth += 1){
    const candidate = current as PgErrorLike;
    if (candidate.code === code) return true;
  }
  return false;
}

export function isUniqueViolation(err: unknown): boolean {
  return hasPgCode(err, UNIQUE_VIOLATION);
}

export function isForeignKeyViolation(err: unknown): boolean{
  return hasPgCode(err, FOREIGN_KEY_VIOLATION);
}