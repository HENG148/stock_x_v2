import { sql } from 'drizzle-orm';
import {
  check,
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema.js';
import { products } from './products.schema.js';

export const BID_STATUSES = ['active', 'matched', 'cancelled', 'expired'] as const;
export const bidStatusEnum = pgEnum('bid_status', BID_STATUSES);

/** A buyer's bid: the highest price they will pay for one item of a given size. */
export const bids = pgTable(
  'bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bidPrice: numeric('bid_price', { precision: 10, scale: 2 }).notNull(),
    size: varchar('size', { length: 20 }).notNull(),
    status: bidStatusEnum('status').notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('bids_active_match_idx')
      .on(table.productId, table.size, table.bidPrice)
      .where(sql`${table.status} = 'active'`),
    index('bids_buyer_id_idx').on(table.buyerId),
    check('bids_bid_price_positive', sql`${table.bidPrice} > 0`),
  ],
);

export type BidRow = typeof bids.$inferSelect;
export type NewBidRow = typeof bids.$inferInsert;