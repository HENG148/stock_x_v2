import { and, eq, gt, lt } from "drizzle-orm";
import { db, DbExecutor } from "../../config/database";
import { sessions, users } from "../../db/schema";
import { AuthUser } from "../../types/auth.types";

export class AuthRepository {
  constructor(private readonly executor: DbExecutor = db) { }
  async createSession(input: {
    tokenHash: string;
    userId: string;
    userAgent: string | null;
    expiresAt: Date;
  }): Promise<void> {
    await this.executor.insert(sessions).values(input)
  }

  async findUserByActiveSessionHash(tokenHash: string): Promise<AuthUser | null>{
    const [row] = await this.executor
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    return row ?? null;
  }

  async deleteSessionByHash(tokenHash: string): Promise<void>{
    await this.executor.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  async deleteAllSessionForUser(userId: string): Promise<void>{
    await this.executor.delete(sessions).where(eq(sessions.userId, userId))
  }

  async deleteExpiredSessions(): Promise<number>{
    const deleted = await this.executor
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date))
      .returning({ id: sessions.id });
    return deleted.length;
  }
}

export const authRepository = new AuthRepository();