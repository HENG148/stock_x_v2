import z from "zod";
import { slugSchema } from "../../shared/validators/common";

const categoryFields = {
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  imageUrl: z.url().max(500).nullable(),
  parentId: z.uuid().nullable()
};

export const createCategorySchema = z.object({
  name: categoryFields.name,
  slug: categoryFields.slug.optional(),
  imageUrl: categoryFields.imageUrl.optional(),
  parentId: categoryFields.parentId.optional()
})
  .strict();

export const updateCategorySchema = z.object({
  name: categoryFields.name.optional(),
  slug: categoryFields.slug.optional(),
  imageUrl: categoryFields.imageUrl.optional(),
  parentId: categoryFields.parentId.optional(),
})
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field" });

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type updateCategoryBody = z.infer<typeof updateCategorySchema>;