import { AppError } from "../../shared/error/app-error";
import { UpdateCategoryInput } from "../../types/category.types";
import { CreateProductInput, ListProductsFilter, ProductDetailDto, ProductDto, UpdateProductInput } from "../../types/products.type";
import { isForeignKeyViolation, isUniqueViolation } from "../../utils/db-error";
import { generateUniqueSlug } from "../../utils/slug";
import { productRepository, ProductRepository } from "../repo/products.repository";

const DUPLICATE_MESSAGE = "A product with this slug or SKU already exists";

export class ProductService {
  constructor(private readonly repo: ProductRepository = productRepository) { }
  
  list(filters: ListProductsFilter): Promise<{ items: ProductDto[]; total: number }>{
    return this.repo.list(filters);
  }

  async getBySlug(slug: string): Promise<ProductDetailDto> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw AppError.notFound("Product not found");
    const market = await this.repo.getMarketData(product.id);
    return { ...product, market };
  }

  async create(input: CreateProductInput): Promise<ProductDto> {
    if (input.categoryId) await this.assertCategoryExists(input.categoryId);
    if (input.sku && (await this.repo.findIdBySku(input.sku))) {
      throw AppError.conflict("A product with this SKU already exists");
    }

    let slug: string;
    if (input.slug) {
      if (await this.repo.slugExists(input.slug)) {
        throw AppError.conflict("A product with this slug already exists");
      }
      slug = input.slug;
    } else {
      slug = await generateUniqueSlug(input.name, (candidate) => 
        this.repo.slugExists(candidate)
      )
    }

    try {
      const id = await this.repo.create({ ...input, slug });
      return await this.requireById(id);
    } catch (err) {
      if (isUniqueViolation(err)) throw AppError.conflict(DUPLICATE_MESSAGE);
      throw err;
    }
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductDto>{
    const current = await this.repo.findById(id);
    if (!current) throw AppError.notFound("Product not found");
    if (input.categoryId) await this.assertCategoryExists(input.categoryId);
    if (input.sku && input.sku !== current.sku) {
      const owner = await this.repo.findIdBySku(input.sku);
      if (owner && owner !== id) throw AppError.conflict("A product with this SKU already exists");
    }

    if (input.slug && input.slug !== current.slug && (await this.repo.slugExists(input.slug))) {
      throw AppError.conflict("A product with this slug already exists");
    }

    try {
      await this.repo.update(id, input);
    } catch (err) {
      if (isUniqueViolation(err)) throw AppError.conflict(DUPLICATE_MESSAGE);
      throw err;
    }
    return this.requireById(id);
  }

  async delete(id: string): Promise<void> {
    try {
      const deleted = await this.repo.delete(id);
      if (!deleted) throw AppError.notFound("Product not found")
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw AppError.conflict("This product has orders and cannot be deleted");
      }
      throw err;
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    if (!(await this.repo.categoryExists(categoryId))) {
      throw AppError.badRequest("Category not found", [
        { path: "body.categoryId", message: "Category not found" },
      ])
    }
  }

  private async requireById(id: string): Promise<ProductDto> {
    const product = await this.repo.findById(id);
    if (!product) throw AppError.notFound("Product not found");
    return product;
  }
}

export const productService = new ProductService();