import { and, asc, count, desc, eq, gt, gte, isNull, lte, or, SQL } from "drizzle-orm";
import { db, DbExecutor } from "../../config/database";
import { bids, listings, products } from "../../db/schema";
import { CreateListingInput, ListingDto, ListOwnListingFilters, UpdateListingInput } from "../../types/listing.types";

const columns = {
  id: listings.id,
  productId: listings.productId,
  askPrice: listings.askPrice,
  size: listings.size,
  status: listings.status,
  expiresAt: listings.expiresAt,
  createdAt: listings.createdAt,
  updatedAt: listings.updatedAt,
  product: {
    id: products.id,
    name: products.name,
    slug: products.slug,
    imageUrl: products.imageUrl,
  },
};

export class ListingRepository {
  constructor(private readonly executor: DbExecutor = db) { }
  async finOwnedById(id: string, sellerId: string): Promise<ListingDto | null> {
    const [row] = await this.executor
      .select(columns)
      .from(listings)
      .innerJoin(products, eq(products.id, listings.productId))
      .where(and(eq(listings.id, id), eq(listings.sellerId, sellerId)));
    return row ?? null;
  }

  async listOwn(
    sellerId: string,
    filters: ListOwnListingFilters,
  ): Promise<{ items: ListingDto[]; total: number }> {
    const conditions: SQL[] = [eq(listings.sellerId, sellerId)];
    if (filters.status) conditions.push(eq(listings.status, filters.status));
    const where = and(...conditions);

    const sortColumn = { createdAt: listings.createdAt, askPrice: listings.askPrice }[
      filters.sortBy
    ];
    const orderBy = filters.order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [items, totals] = await Promise.all([
      this.executor
        .select(columns)
        .from(listings)
        .innerJoin(products, eq(products.id, listings.productId))
        .where(where)
        .orderBy(orderBy, asc(listings.id))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      this.executor.select({ total: count() }).from(listings).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async create(sellerId: string, input: CreateListingInput): Promise<string> {
    const [row] = await this.executor
      .insert(listings)
      .values({ ...input, sellerId })
      .returning({ id: listings.id });
    if (!row) throw new Error('Failed to insert listing');
    return row.id;
  }

  /** Only touches a listing that is still active; false means it changed state meanwhile. */
  async updateActive(id: string, sellerId: string, patch: UpdateListingInput): Promise<boolean> {
    const updated = await this.executor
      .update(listings)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(eq(listings.id, id), eq(listings.sellerId, sellerId), eq(listings.status, 'active')),
      )
      .returning({ id: listings.id });
    return updated.length > 0;
  }

  async cancelActive(id: string, sellerId: string): Promise<boolean> {
    const updated = await this.executor
      .update(listings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(eq(listings.id, id), eq(listings.sellerId, sellerId), eq(listings.status, 'active')),
      )
      .returning({ id: listings.id });
    return updated.length > 0;
  }

  /** Marks overdue active listings as expired, for one seller or (no argument) everyone. */
  async expireOverdue(sellerId?: string): Promise<number> {
    const conditions: SQL[] = [eq(listings.status, 'active'), lte(listings.expiresAt, new Date())];
    if (sellerId) conditions.push(eq(listings.sellerId, sellerId));
    const updated = await this.executor
      .update(listings)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: listings.id });
    return updated.length;
  }

  async productExists(productId: string): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    return Boolean(row);
  }

  /**
   * Read-only check against the bids table: does this user already have a live bid on the same
   * product and size at or above `askPrice`? Such an ask would match their own bid.
   */
  async hasOwnBidAtOrAbove(
    userId: string,
    productId: string,
    size: string,
    askPrice: string,
  ): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: bids.id })
      .from(bids)
      .where(
        and(
          eq(bids.buyerId, userId),
          eq(bids.productId, productId),
          eq(bids.size, size),
          eq(bids.status, 'active'),
          or(isNull(bids.expiresAt), gt(bids.expiresAt, new Date())),
          gte(bids.bidPrice, askPrice),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
}

export const listingRepository = new ListingRepository();