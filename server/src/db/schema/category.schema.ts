import  type { AnyPgColumn } from "drizzle-orm/pg-core";
import { timestamp, index, varchar, uuid, pgTable } from "drizzle-orm/pg-core";

export const categories = pgTable('categories', {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null"
  }),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("categoris_parent_id_idx").on(table.parentId)]);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;