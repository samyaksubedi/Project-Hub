import { z } from "zod";
export const idSchema = z.string().uuid();
export const httpUrl = z
  .string()
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value), "Use an http or https URL");
export const optionalUrl = z
  .union([httpUrl, z.literal(""), z.null()])
  .optional()
  .transform((v) => v || null);
export const pagination = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
};