import { and, asc, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { db, DbExecutor } from "../../config/database";
import { users } from "../../db/schema";
import { CreateUserInput, ListUsersFilters, PublicUser, UpdateProfileInput, UserCredentials } from "../../types/user.types";
import { UserRole } from "../../shared/constants/role";
import { UserRow } from "../../db/schema";

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  image: users.image,
  createdAt: users.createdAt,
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export class UserRepository {
  constructor(private readonly executor: DbExecutor = db) { }
  
  async findPublicById(id: string): Promise<PublicUser | null> {
    const [row] = await this.executor.select(publicColumns).from(users).where(eq(users.id, id));
    return row ?? null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const [row] = await this.executor
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email));
    return row ?? null;
  }

  async emailExists(email: string): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return Boolean(row);
  }

  async create(input: CreateUserInput): Promise<PublicUser> {
    const [row] = await this.executor
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role ?? "customer",
      })
      .returning(publicColumns);
    if (!row) throw new Error("Failed to insert user");
    return row;
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser | null> {
    const [row] = await this.executor
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(publicColumns);
    return row ?? null;
  }
 
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.executor
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
 
  async updateRole(id: string, role: UserRole): Promise<PublicUser | null> {
    const [row] = await this.executor
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(publicColumns);
    return row ?? null;
  }
 
  async list(filters: ListUsersFilters): Promise<{ items: PublicUser[]; total: number }> {
    const conditions: SQL[] = [];
    if (filters.role) conditions.push(eq(users.role, filters.role));
    if (filters.search) {
      const pattern = `%${escapeLike(filters.search)}%`;
      const searchCondition = or(ilike(users.email, pattern), ilike(users.name, pattern));
      if (searchCondition) conditions.push(searchCondition);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
 
    const sortColumn = { createdAt: users.createdAt, email: users.email, name: users.name }[
      filters.sortBy
    ];
    const orderBy = filters.order === 'asc' ? asc(sortColumn) : desc(sortColumn);
 
    const [items, totals] = await Promise.all([
      this.executor
        .select(publicColumns)
        .from(users)
        .where(where)
        .orderBy(orderBy, asc(users.id))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      this.executor.select({ total: count() }).from(users).where(where),
    ]);
 
    return { items, total: totals[0]?.total ?? 0 };
  }
}

export type { UserRow };
export const userRepository = new UserRepository();