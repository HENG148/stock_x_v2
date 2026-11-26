import { and, asc, count, desc, eq } from "drizzle-orm";
import { db, DbExecutor } from "../../config/database";
import { products, watchlist } from "../../db/schema";
import { ListWatchlistFilters, WatchlistItemDto } from "../../types/watchlist.types";

const columns = {
  id: watchlist.id,
  productId: watchlist.productId,
  createdAt: watchlist.createdAt,
  product: {
    id: products.id,
    name: products.name,
    slug: products.slug,
    brand: products.brand,
    imageUrl: products.imageUrl,
    retailPrice: products.retailPrice,
  }
}


export class WatchlistRepository {
  constructor(private readonly executor: DbExecutor = db) { }
  
  async add(userId: string, productId: string): Promise<boolean> {
    const inserted = await this.executor
      .insert(watchlist)
      .values({ userId, productId })
      .onConflictDoNothing({ target: [watchlist.userId, watchlist.productId] })
      .returning({ id: watchlist.id })
    return inserted.length > 0;
  }

  async find(userId: string, productId: string): Promise<WatchlistItemDto | null> {
    const [row] = await this.executor
      .select(columns)
      .from(watchlist)
      .innerJoin(products, eq(products.id, watchlist.productId))
      .where(and(eq(watchlist.userId, userId), eq(watchlist.productId, productId)));
    return row ?? null;
  }

  async list(
    userId: string,
    filters: ListWatchlistFilters,
  ): Promise<{ items: WatchlistItemDto[]; total: number }> {
    const where = eq(watchlist.userId, userId);
    const orderBy = filters.order === 'asc' ? asc(watchlist.createdAt) : desc(watchlist.createdAt);

    const [items, totals] = await Promise.all([
      this.executor
        .select(columns)
        .from(watchlist)
        .innerJoin(products, eq(products.id, watchlist.productId))
        .where(where)
        .orderBy(orderBy, asc(watchlist.id))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      this.executor.select({ total: count() }).from(watchlist).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const deleted = await this.executor
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.productId, productId)))
      .returning({ id: watchlist.id });
    return deleted.length > 0;
  }

  async productExist(productId: string): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
    return Boolean(row);
  }
}

export const watchlistRepository = new WatchlistRepository();