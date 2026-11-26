import z from "zod";
import { paginationQuerySchema } from "../../shared/validators/common";

export const addToWatchlistSchema = z.object({
  productId: z.uuid()
}).strict();

export const watchlistProductParamSchema = z.object({ productId: z.uuid() });
export const listWatchlistQuerySchema = paginationQuerySchema.extend({
  order: z.enum(["asc", "desc"]).default("desc"),
})

export type AddToWatchlistBody = z.input<typeof addToWatchlistSchema>
export type ListWatchlistQuery = z.infer<typeof listWatchlistQuerySchema>;