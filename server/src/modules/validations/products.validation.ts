import z from "zod";
import { booleanQuerySchema, moneySchema, paginationQuerySchema, searchQuerySchema, slugSchema, sortQuerySchema } from "../../shared/validators/common";

export const PRODUCT_SORT_FIELDS = ["createdAt", "name", "retailPrice"] as const;

export const listProductsQuerySchema = paginationQuerySchema
  .extend(searchQuerySchema.shape)
  .extend(sortQuerySchema(PRODUCT_SORT_FIELDS, 'createdAt').shape)
  .extend({
    category: slugSchema.optional(),
    brand: z.string().trim().min(1).max(100).optional(),
    section: z.string().trim().min(1).max(50).optional(),
    featured: booleanQuerySchema.optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
  })
  .refine((value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      Number(value.minPrice) <= Number(value.maxPrice),
    { message: 'minPrice must not exceed maxPrice', path: ['minPrice'] },
  );

const productFields = {
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  brand: z.string().trim().min(1).max(100).nullable(),
  sku: z.string().trim().min(1).max(100).nullable(),
  description: z.string().trim().max(5000).nullable(),
  retailPrice: moneySchema,
  imageUrl: z.url().max(500).nullable(),
  categoryId: z.uuid().nullable(),
  isFeatured: z.boolean(),
  featuredUntil: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .nullable(),
  section: z.string().trim().min(1).max(50),
};

export const createProductSchema = z
  .object({
    name: productFields.name,
    retailPrice: productFields.retailPrice,
    slug: productFields.slug.optional(),
    brand: productFields.brand.optional(),
    sku: productFields.sku.optional(),
    description: productFields.description.optional(),
    imageUrl: productFields.imageUrl.optional(),
    categoryId: productFields.categoryId.optional(),
    isFeatured: productFields.isFeatured.optional(),
    featuredUntil: productFields.featuredUntil.optional(),
    section: productFields.section.optional(),
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: productFields.name.optional(),
    retailPrice: productFields.retailPrice.optional(),
    slug: productFields.slug.optional(),
    brand: productFields.brand.optional(),
    sku: productFields.sku.optional(),
    description: productFields.description.optional(),
    imageUrl: productFields.imageUrl.optional(),
    categoryId: productFields.categoryId.optional(),
    isFeatured: productFields.isFeatured.optional(),
    featuredUntil: productFields.featuredUntil.optional(),
    section: productFields.section.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one field' });

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;