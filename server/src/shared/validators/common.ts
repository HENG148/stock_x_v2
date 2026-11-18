import z from "zod";

export const uuidParamSchema = z.object({ id: z.uuid() });
export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(200) });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const emailSchema = z.email().max(255).transform((value) => value.trim().toLowerCase());
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);
export const idParamSchema = z.object({ id: z.uuid() });
export const slugSchema = z.string().trim().toLowerCase().max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, number and single hyphens");

export const moneySchema = z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Use a non-negative amount with up to 2 decimals');
export const positiveMoneySchema = moneySchema.refine((value) => Number(value) > 0, {
  message: "Amunt must be greater than 0"
})
export const booleanQuerySchema = z.enum(["true", "false"]).transform((value) => value === "true");
export const searchQuerySchema =z.object({
  search: z.string().trim().min(1).max(100).optional()
})

export const sizeSchema = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9][A-Za-z0-9.\-/ ]*$/, 'Use letters, numbers, ".", "-" or "/"').transform((val) => val.toUpperCase());

export const futureDateSchema = z.iso.datetime({ offset: true }).transform((value) => new Date(value)).refine((date) => date.getTime() > Date.now(), { message: "Date must be in the future" });

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