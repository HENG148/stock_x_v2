import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './category.schema.js';

/**
 * Catalogue entry only. Market data (lowest ask, highest bid, last sale) is derived from
 * listings, bids and orders instead of being stored here, and per-item stock lives on listings.
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 200 }).notNull(),
    brand: varchar('brand', { length: 100 }),
    sku: varchar('sku', { length: 100 }).unique(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    description: text('description'),
    retailPrice: numeric('retail_price', { precision: 10, scale: 2 }).notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    isFeatured: boolean('is_featured').notNull().default(false),
    featuredUntil: timestamp('featured_until', { withTimezone: true }),
    // Allowed values are not confirmed yet, so this stays free text (default matches the old app).
    section: varchar('section', { length: 50 }).notNull().default('all'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_category_id_idx').on(table.categoryId),
    index('products_brand_idx').on(table.brand),
    index('products_featured_idx').on(table.isFeatured, table.featuredUntil),
    index('products_created_at_idx').on(table.createdAt),
    check('products_retail_price_nonneg', sql`${table.retailPrice} >= 0`),
  ],
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;