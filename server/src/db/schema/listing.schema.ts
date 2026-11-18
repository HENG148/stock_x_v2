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

export const LISTING_STATUSES = ['active', 'sold', 'cancelled', 'expired'] as const;
export const listingStatusEnum = pgEnum('listing_status', LISTING_STATUSES);

/** A seller's ask: the lowest price they will accept for one item of a given size. */
export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    askPrice: numeric('ask_price', { precision: 10, scale: 2 }).notNull(),
    size: varchar('size', { length: 20 }).notNull(),
    status: listingStatusEnum('status').notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Serves "lowest active ask for this product and size", the hot path for matching.
    index('listings_active_match_idx')
      .on(table.productId, table.size, table.askPrice)
      .where(sql`${table.status} = 'active'`),
    index('listings_seller_id_idx').on(table.sellerId),
    check('listings_ask_price_positive', sql`${table.askPrice} > 0`),
  ],
);

export type ListingRow = typeof listings.$inferSelect;
export type NewListingRow = typeof listings.$inferInsert;