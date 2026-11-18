import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema.js';
import { listings } from './listing.schema.js';
import { bids } from './bids.schema.js';
import { products } from './products.schema.js';

// The old app only showed the default `pending`; the rest of this flow is a proposal to confirm.
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const;
export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES);

/**
 * Orders are financial records, so buyer, seller and product references use RESTRICT:
 * deleting a user or product that has orders is blocked instead of silently orphaning history.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // UNIQUE guarantees one listing / one bid can only ever produce one order.
    listingId: uuid('listing_id')
      .unique()
      .references(() => listings.id, { onDelete: 'set null' }),
    bidId: uuid('bid_id')
      .unique()
      .references(() => bids.id, { onDelete: 'set null' }),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_buyer_id_idx').on(table.buyerId),
    index('orders_seller_id_idx').on(table.sellerId),
    index('orders_status_idx').on(table.status),
    check('orders_total_nonneg', sql`${table.total} >= 0`),
    check('orders_buyer_not_seller', sql`${table.buyerId} <> ${table.sellerId}`),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull().default(1),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    size: varchar('size', { length: 20 }).notNull(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_product_id_idx').on(table.productId),
    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_price_nonneg', sql`${table.price} >= 0`),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;