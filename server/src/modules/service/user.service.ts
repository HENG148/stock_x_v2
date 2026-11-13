import { UserRole } from "../../shared/constants/role";
import { AppError } from "../../shared/error/app-error";
import { CreateUserInput, ListUsersFilters, PublicUser, UpdateProfileInput, UserCredentials } from "../../types/user.types";
import { isUniqueViolation } from "../../utils/db-error";
import { userRepository, UserRepository } from "../repo/user.repository";

export class UserService {
  constructor(private readonly repository: UserRepository = userRepository) { }
  async createUser(input: CreateUserInput): Promise<PublicUser>{
    if (await this.repository.emailExists(input.email)) {
      throw AppError.conflict("An account with this email already exists");
    }
    try {
      return await this.repository.create(input);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw AppError.conflict("An accountt with this email already exists");
      }
      throw err;
    }
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null>{
    return this.repository.findCredentialsByEmail(email);
  }
  upgradePasswordHash(userId: string, passwordHash: string): Promise<void> {
    return this.repository.updatePasswordHash(userId, passwordHash);
  }

  async getById(id: string): Promise<PublicUser> {
    const user = await this.repository.findPublicById(id);
    if (!user) throw AppError.notFound("User not found");
    return user;
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser>{
    const user = await this.repository.updateProfile(id, input);
    if (!user) throw AppError.notFound("User not found");
    return user;
  }
  
  list(filters: ListUsersFilters): Promise<{ items: PublicUser[]; total: number }>{
    return this.repository.list(filters);
  }

  async changeRole(actorId: string, targetId: string, role: UserRole): Promise<PublicUser> {
    if (actorId === targetId) {
      throw AppError.forbidden("You cannot change you own role");
    }
    const user = await this.repository.updateRole(targetId, role);
    if (!user) throw AppError.notFound("User not found");
    return user;
  }
}

export const userService = new UserService();