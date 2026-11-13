import { UserRole } from "../shared/constants/role";

export interface PublicUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date
}

export interface UserCredentials {
  id: string;
  passwordHash: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export interface UpdateProfileInput {
  name?: string;
  image?: string | null;
}

export interface ListUsersFilters {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  sortBy: "createdAt" | "email" | "name";
  order: "asc" | "desc";
}