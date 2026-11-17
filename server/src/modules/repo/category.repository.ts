import { asc, count, eq } from "drizzle-orm";
import { db, DbExecutor } from "../../config/database";
import { categories } from "../../db/schema/category.schema";
import { CategoryDto } from "../../types/category.types";

const columns = {
  id: categories.id,
  parentId: categories.parentId,
  name: categories.name,
  slug: categories.slug,
  imageUrl: categories.imageUrl,
  createdAt: categories.createdAt
}

export class CategoryRepository{
  constructor(private readonly executor: DbExecutor = db) { }
  
  listAll(): Promise<CategoryDto[]> {
    return this.executor.select(columns).from(categories).orderBy(asc(categories.name));
  }

  async findById(id: string): Promise<CategoryDto | null> {
    const [row] = await this.executor.select(columns).from(categories).where(eq(categories.id, id));
    return row ?? null;
  }

  async findBySlug(slug: string): Promise<CategoryDto | null> {
    const [row] = await this.executor
      .select(columns)
      .from(categories)
      .where(eq(categories.slug, slug));
    return row ?? null;
  }

  listChildren(parentId: string): Promise<CategoryDto[]>{
    return this.executor
      .select(columns)
      .from(categories)
      .where(eq(categories.parentId, parentId))
      .orderBy(asc(categories.name));
  }

  async countChildren(parentId: string): Promise<number> {
    const [row] = await this.executor
      .select({ total: count() })
      .from(categories)
      .where(eq(categories.parentId, parentId));
    return row?.total ?? 0;
  }

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  async nameExists(name: string): Promise<{ id: string } | null> {
    const [row] = await this.executor
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    return row ?? null;
  }

  async create(input: {
    name: string;
    slug: string;
    imageUrl?: string | null;
    parentId?: string | null;
  }): Promise<CategoryDto> {
    const [row] = await this.executor.insert(categories).values(input).returning(columns);
    if (!row) throw new Error('Failed to insert category');
    return row;
  }

  async update(
    id: string,
    input: { name?: string; slug?: string; imageUrl?: string | null; parentId?: string | null },
  ): Promise<CategoryDto | null> {
    const [row] = await this.executor
      .update(categories)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning(columns);
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.executor
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    return deleted.length > 0;
  }
}

export const categoryRepository = new CategoryRepository();