import { and, asc, count, desc, eq, getTableColumns, gt, gte, ilike, inArray, isNull, lte, max, min, ne, not, or, sql, SQL } from "drizzle-orm";
import { bids, categories, listings, products } from "../../db/schema";
import { db, DbExecutor } from "../../config/database";
import { CreateProductInput, ListProductsFilter, MarketData, ProductDto, UpdateProductInput } from "../../types/products.type";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { orderItems, orders } from "../../db/schema/order.schema";
// import { categories } from "../../db/schema/category.schema";

const productColumns = {
  ...getTableColumns(products), category: { id: categories.id, name: categories.name, slug: categories.slug}
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export class ProductRepository {
  constructor(private readonly executor: DbExecutor = db) { }
  async findBySlug(slug: string): Promise<ProductDto | null> {
    const [row] = await this.executor
      .select(productColumns)
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(products.slug, slug));
    return row ?? null;
  }

  async findById(id: string): Promise<ProductDto | null> {
    const [row] = await this.executor
      .select(productColumns)
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(products.id, id));
    return row ?? null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  /** Returns the id of another product using this SKU, if any. */
  async findIdBySku(sku: string): Promise<string | null> {
    const [row] = await this.executor
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);
    return row?.id ?? null;
  }

  async categoryExists(id: string): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return Boolean(row);
  }

  async create(input: CreateProductInput & { slug: string }): Promise<string> {
    const [row] = await this.executor.insert(products).values(input).returning({ id: products.id })
    if (!row) throw new Error("Failed to insert product");
    return row.id;
  }

  async update(id: string, input: UpdateProductInput): Promise<boolean> {
    const updated = await this.executor
      .update(products)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return updated.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.executor
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return deleted.length > 0;
  }

  async list(filters: ListProductsFilter): Promise<{ items: ProductDto[]; total: number }> {
    const conditions: SQL[] = [];

    if (filters.search) {
      const pattern = `%${escapeLike(filters.search)}%`;
      const match = or(
        ilike(products.name, pattern),
        ilike(products.brand, pattern),
        ilike(products.sku, pattern),
      );
      if (match) conditions.push(match);
    }
    if (filters.brand) {
      conditions.push(sql`lower(${products.brand}) = ${filters.brand.toLowerCase()}`);
    }
    if (filters.section) conditions.push(eq(products.section, filters.section));
    if (filters.featured !== undefined) {
      // "Featured" means flagged and not past its end date; `false` is the exact complement.
      const featuredNow = and(
        eq(products.isFeatured, true),
        or(isNull(products.featuredUntil), gt(products.featuredUntil, new Date())),
      ) as SQL;
      conditions.push(filters.featured ? featuredNow : not(featuredNow));
    }
    if (filters.minPrice) conditions.push(gte(products.retailPrice, filters.minPrice));
    if (filters.maxPrice) conditions.push(lte(products.retailPrice, filters.maxPrice));
    if (filters.category) {
      // The category itself plus its direct subcategories.
      const parentIds = this.executor
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, filters.category));
      const familyIds = this.executor
        .select({ id: categories.id })
        .from(categories)
        .where(or(eq(categories.slug, filters.category), inArray(categories.parentId, parentIds)));
      conditions.push(inArray(products.categoryId, familyIds));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = {
      createdAt: products.createdAt,
      name: products.name,
      retailPrice: products.retailPrice,
    }[filters.sortBy];
    const orderBy = filters.order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [items, totals] = await Promise.all([
      this.executor
        .select(productColumns)
        .from(products)
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .where(where)
        .orderBy(orderBy, asc(products.id))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      this.executor.select({ total: count() }).from(products).where(where),
    ]);

    return { items, total: totals[0]?.total ?? 0 };
  }

  /**
   * Read-only market snapshot. Reads the listings, bids and orders tables directly because those
   * modules do not exist yet; move this behind their services once they do.
   */
  async getMarketData(productId: string): Promise<MarketData> {
    const now = new Date();
    const notExpired = (column: AnyPgColumn) => or(isNull(column), gt(column, now));

    const [ask] = await this.executor
      .select({ value: min(listings.askPrice) })
      .from(listings)
      .where(
        and(
          eq(listings.productId, productId),
          eq(listings.status, 'active'),
          notExpired(listings.expiresAt),
        ),
      );
    const [bid] = await this.executor
      .select({ value: max(bids.bidPrice) })
      .from(bids)
      .where(
        and(eq(bids.productId, productId), eq(bids.status, 'active'), notExpired(bids.expiresAt)),
      );
    const [sale] = await this.executor
      .select({ price: orderItems.price })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.productId, productId), ne(orders.status, 'cancelled')))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    return {
      lowestAsk: ask?.value ?? null,
      highestBid: bid?.value ?? null,
      lastSalePrice: sale?.price ?? null,
    };
  }
}

export const productRepository = new ProductRepository();