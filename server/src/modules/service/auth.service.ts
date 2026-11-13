import { env } from "../../config/env";
import { AppError } from "../../shared/error/app-error";
import { AuthResult, AuthUser, CreatedSession } from "../../types/auth.types";
import { burnPasswordChekc, hashPassword, verifyPassword } from "../../utils/password";
import { generateSessionToken, hashToken } from "../../utils/token";
import { authRepository, AuthRepository } from "../repo/auth.repository";
import { LoginBody, RegisterBody } from "../validations/auth.validation";
import { UserService, userService } from "./user.service";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository = authRepository,
    private readonly users: UserService = userService
  ) { }
  
  async register(input: RegisterBody, userAgent: string | null): Promise<AuthResult> {
    const passwordHash = await hashPassword(input.password);
    const created = await this.users.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "customer",
    });
    const user = await this.users.getById(created.id);
    const session = await this.createSession(user.id, userAgent);
    return { user: toAuthUser(user), session };
  }

  async login(input: LoginBody, userAgent: string | null): Promise<AuthResult> {
    const credentials = await this.users.findCredentialsByEmail(input.email);
    if (!credentials) {
      await burnPasswordChekc(input.password);
      throw AppError.invalidCredentials();
    }
    const check = await verifyPassword(credentials.passwordHash, input.password);
    if (!check.valid) throw AppError.invalidCredentials();
    if (check.needsRehash) {
      await this.users.upgradePasswordHash(credentials.id, await hashPassword(input.password))
    }
    const user = await this.users.getById(credentials.id);
    const session = await this.createSession(user.id, userAgent);
    return { user: toAuthUser(user), session };
  }

  async logout(token: string): Promise<void> {
    await this.repository.deleteSessionByHash(hashToken(token));
  }

  getUserFromSessionToken(token: string): Promise<AuthUser | null>{
    return this.repository.findUserByActiveSessionHash(hashToken(token));
  }

  purgeExpiredSession(): Promise<number>{
    return this.repository.deleteExpiredSessions();
  }

  private async createSession(userId: string, userAgent: string | null): Promise<CreatedSession> {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
    await this.repository.createSession({
      tokenHash: hashToken(token),
      userId,
      userAgent: userAgent?.slice(0, 255) ?? null,
      expiresAt,
    });
    return { token, expiresAt };
  }
}

function toAuthUser(user: AuthUser & { createdAt?: Date }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image
  };
}

export const authService = new AuthService();