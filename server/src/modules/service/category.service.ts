import { AppError } from "../../shared/error/app-error";
import { CategoryDetailDto, CategoryDto, CreateCategoryInput, UpdateCategoryInput } from "../../types/category.types";
import { isUniqueViolation } from "../../utils/db-error";
import { generateUniqueSlug } from "../../utils/slug";
import { categoryRepository, CategoryRepository } from "../repo/category.repository";

const DUPLICATE_MESSAGE = "A category with this name or slug already exists";

export class CategoryService {
  constructor(private readonly repository: CategoryRepository = categoryRepository) { }
  list(): Promise<CategoryDto[]> {
    return this.repository.listAll();
  }

  async getBySlug(slug: string): Promise<CategoryDetailDto> {
    const category = await this.repository.findBySlug(slug);
    if (!category) throw AppError.notFound("Category not found");
    const children = await this.repository.listChildren(category.id)
    return { ...category, children };
  }

  async create(input: Omit<CreateCategoryInput, "slug"> & { slug?: string }): Promise<CategoryDto> {
    if (await this.repository.nameExists(input.name)) throw AppError.conflict(DUPLICATE_MESSAGE);
    if (input.parentId) await this.assertValidParent(input.parentId, null);
    let slug: string;
    if (input.slug) {
      if (await this.repository.slugExists(input.slug))
        throw AppError.conflict(DUPLICATE_MESSAGE);
      slug = input.slug;
    } else {
      slug = await generateUniqueSlug(input.name, (candidate) => this.repository.slugExists(candidate))
    }

    try {
      return await this.repository.create({ ...input, slug });
    } catch (err) {
      if (isUniqueViolation(err)) throw AppError.conflict(DUPLICATE_MESSAGE);
      throw err;
    }
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    const current = await this.repository.findById(id);
    if (!current) throw AppError.notFound("Category not found");
    if (input.name !== undefined && input.name !== current.name) {
      const clash = await this.repository.nameExists(input.name);
      if (clash && clash.id !== id) throw AppError.conflict(DUPLICATE_MESSAGE);
    }
    if (input.slug !== undefined && input.slug !== current.slug) {
      if (await this.repository.slugExists(input.slug)) throw AppError.conflict(DUPLICATE_MESSAGE);
    }
    if (input.parentId) await this.assertValidParent(input.parentId, id);

    try {
      const updated = await this.repository.update(id, input);
      if (!updated) throw AppError.notFound("Category not found");
      return updated;
    } catch (err) {
      if (isUniqueViolation(err)) throw AppError.conflict(DUPLICATE_MESSAGE);
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    if ((await this.repository.countChildren(id)) > 0) {
      throw AppError.conflict("Move or delete the category's subcategories first");
    }
    const deleted = await this.repository.delete(id);
    if (!deleted) throw AppError.notFound("Category not found");
  }

  private async assertValidParent(parentId: string, selfId: string | null): Promise<void> {
    if (parentId === selfId) {
      throw AppError.badRequest("A category cannot be its own parents", [
        { path: "body.parentId", message: "A category cannot be its own parent" },
      ])
    }
    const parent = await this.repository.findById(parentId);
    if (!parent) {
      throw AppError.badRequest("Parent category not found", [
        { path: "body.parentId", message: "Parent category not found" }
      ]);
    }
    if (parent.parentId) {
      throw AppError.badRequest("Categories can only be nested two levels deep", [
        { path: "body.parentId", message: "The chosen parent is already a subcategory" }
      ]);
    }
    if (selfId && (await this.repository.countChildren(selfId)) > 0) {
      throw AppError.badRequest("A category with subcategories cannot become a subcategory", [
        { path: "body.parentId", message: "This category has subcategories of its own" },
      ]);
    }
  }
}

export const categoryService = new CategoryService();