import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './user.schema.js';
import { products } from './products.schema.js';

export const watchlist = pgTable(
  'watchlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('watchlist_user_product_unique').on(table.userId, table.productId),
    index('watchlist_product_id_idx').on(table.productId),
  ],
);

export type WatchlistRow = typeof watchlist.$inferSelect;
export type NewWatchlistRow = typeof watchlist.$inferInsert;