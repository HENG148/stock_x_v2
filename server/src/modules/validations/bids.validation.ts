import z from "zod";
import { futureDateSchema, paginationQuerySchema, positiveMoneySchema, sizeSchema, sortQuerySchema } from "../../shared/validators/common";
import { BID_STATUSES } from "../../db/schema";

export const createBidSchema = z.object({
  productId: z.uuid(),
  bidPrice: positiveMoneySchema,
  size: sizeSchema,
  expiresAt: futureDateSchema.optional(),
})
  .strict();

export const updateBidSchema = z.object({
  bidPrice: positiveMoneySchema.optional(),
  expiresAt: futureDateSchema.nullable().optional()
})
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field" });

export const listOwnBidsQuerySchema = paginationQuerySchema
  .extend(sortQuerySchema(["createdAt", "bidPrice"] as const, "createdAt").shape)
  .extend({ status: z.enum(BID_STATUSES).optional() });

export type CreateBidBody = z.infer<typeof createBidSchema>;
export type UpdateBidBody = z.infer<typeof updateBidSchema>;
export type ListOwnBidsQuery = z.infer<typeof listOwnBidsQuerySchema>;