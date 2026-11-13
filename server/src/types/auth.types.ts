import { UserRole } from "../shared/constants/role";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole
  image: string | null
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export interface AuthResult {
  user: AuthUser;
  session: CreatedSession;
}