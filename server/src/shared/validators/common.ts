import z from "zod";

export const uuidParamSchema = z.object({ id: z.uuid() });
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const emailSchema = z.email().max(255).transform((value) => value.trim().toLowerCase());
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);
export const idParamSchema = z.object({ id: z.uuid() });
export const slugSchema = z.string().trim().toLowerCase().max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, number and single hyphens");
export const searchQuerySchema =z.object({
  search: z.string().trim().min(1).max(100).optional()
})

export function sortQuerySchema<const T extends readonly [string, ...string[]]>(
  field: T,
  defaultField: T[number],
) {
  return z.object({
    sortBy: z.enum(field).default(defaultField),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
}
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;