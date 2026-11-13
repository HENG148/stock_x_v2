import z from "zod";
import { paginationQuerySchema } from "../../shared/validators/common";
import { USER_ROLES } from "../../shared/constants/role";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  image: z.url().max(500).nullable().optional(),
})
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field"
  }); 

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(USER_ROLES).optional(),
  sortBy: z.enum(["createdAt", "email", "name"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export const updateRoleSchema = z.object({ role: z.enum(USER_ROLES) }).strict();

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>;