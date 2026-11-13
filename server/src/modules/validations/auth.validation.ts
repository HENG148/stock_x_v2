import z from "zod";

const emailSchema = z.email().max(255).transform((value) => value.trim().toLowerCase());
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})
  .strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
})
  .strict();

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;