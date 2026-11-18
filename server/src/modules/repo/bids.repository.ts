import { and, asc, count, desc, eq, gt, isNull, lte, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '../../config/database.js';
import type { DbExecutor } from '../../config/database.js';
import { bids, listings, products } from '../../db/schema/index.js';
import { BidDto, CreateBidInput, ListOwnBidsFilters, UpdateBidInput } from '../../types/bids.types.js';

const columns = {
  id: bids.id,
  productId: bids.productId,
  bidPrice: bids.bidPrice,
  size: bids.size,
  status: bids.status,
  expiresAt: bids.expiresAt,
  createdAt: bids.createdAt,
  updatedAt: bids.updatedAt,
  product: {
    id: products.id,
    name: products.name,
    slug: products.slug,
    imageUrl: products.imageUrl,
  },
};

export class BidRepository {
  constructor(private readonly executor: DbExecutor = db) {}

  async findOwnedById(id: string, buyerId: string): Promise<BidDto | null> {
    const [row] = await this.executor
      .select(columns)
      .from(bids)
      .innerJoin(products, eq(products.id, bids.productId))
      .where(and(eq(bids.id, id), eq(bids.buyerId, buyerId)));
    return row ?? null;
  }

  async listOwn(
    buyerId: string,
    filters: ListOwnBidsFilters,
  ): Promise<{ items: BidDto[]; total: number }> {
    const conditions: SQL[] = [eq(bids.buyerId, buyerId)];
    if (filters.status) conditions.push(eq(bids.status, filters.status));
    const where = and(...conditions);

    const sortColumn = { createdAt: bids.createdAt, bidPrice: bids.bidPrice }[filters.sortBy];
    const orderBy = filters.order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [items, totals] = await Promise.all([
      this.executor
        .select(columns)
        .from(bids)
        .innerJoin(products, eq(products.id, bids.productId))
        .where(where)
        .orderBy(orderBy, asc(bids.id))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      this.executor.select({ total: count() }).from(bids).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async create(buyerId: string, input: CreateBidInput): Promise<string> {
    const [row] = await this.executor
      .insert(bids)
      .values({ ...input, buyerId })
      .returning({ id: bids.id });
    if (!row) throw new Error('Failed to insert bid');
    return row.id;
  }

  /** Only touches a bid that is still active; false means it changed state meanwhile. */
  async updateActive(id: string, buyerId: string, patch: UpdateBidInput): Promise<boolean> {
    const updated = await this.executor
      .update(bids)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(bids.id, id), eq(bids.buyerId, buyerId), eq(bids.status, 'active')))
      .returning({ id: bids.id });
    return updated.length > 0;
  }

  async cancelActive(id: string, buyerId: string): Promise<boolean> {
    const updated = await this.executor
      .update(bids)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(bids.id, id), eq(bids.buyerId, buyerId), eq(bids.status, 'active')))
      .returning({ id: bids.id });
    return updated.length > 0;
  }

  /** Marks overdue active bids as expired, for one buyer or (no argument) everyone. */
  async expireOverdue(buyerId?: string): Promise<number> {
    const conditions: SQL[] = [eq(bids.status, 'active'), lte(bids.expiresAt, new Date())];
    if (buyerId) conditions.push(eq(bids.buyerId, buyerId));
    const updated = await this.executor
      .update(bids)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: bids.id });
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
   * Read-only check against the listings table: does this user already have a live ask on the
   * same product and size at or below `bidPrice`? Such a bid would match their own listing.
   */
  async hasOwnListingAtOrBelow(
    userId: string,
    productId: string,
    size: string,
    bidPrice: string,
  ): Promise<boolean> {
    const [row] = await this.executor
      .select({ id: listings.id })
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, userId),
          eq(listings.productId, productId),
          eq(listings.size, size),
          eq(listings.status, 'active'),
          or(isNull(listings.expiresAt), gt(listings.expiresAt, new Date())),
          lte(listings.askPrice, bidPrice),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
}

export const bidRepository = new BidRepository();