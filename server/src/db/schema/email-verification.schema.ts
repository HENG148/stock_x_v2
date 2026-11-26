import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/** Replaces `verification_tokens`: the 6-digit code is stored hashed and attempts are capped. */
export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_verification_codes_email_idx').on(table.email),
    index('email_verification_codes_expires_at_idx').on(table.expiresAt),
  ],
);

export type EmailVerificationCodeRow = typeof emailVerificationCodes.$inferSelect;
export type NewEmailVerificationCodeRow = typeof emailVerificationCodes.$inferInsert;