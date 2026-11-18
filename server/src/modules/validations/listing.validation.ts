import z from "zod";
import { futureDateSchema, paginationQuerySchema, positiveMoneySchema, sizeSchema, sortQuerySchema } from "../../shared/validators/common";
import { LISTING_STATUSES } from "../../db/schema";

export const createListingSchema = z.object({
  productId: z.uuid(),
  askPrice: positiveMoneySchema,
  size: sizeSchema,
  expiresAt: futureDateSchema.optional(),
})
  .strict();

export const updateListingSchema = z.object({
  askPrice: positiveMoneySchema.optional(),
  expiresAt: futureDateSchema.nullable().optional(),
})
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field" });

export const listOwnListingQuerySchema = paginationQuerySchema
  .extend(sortQuerySchema(["createdAt", "askPrice"] as const, "createdAt").shape)
  .extend({ status: z.enum(LISTING_STATUSES).optional() });

export type CreateListingBody = z.infer<typeof createListingSchema>;
export type UpdateListingBody = z.infer<typeof updateListingSchema>;
export type ListOwnListingsQuery = z.infer<typeof listOwnListingQuerySchema>;