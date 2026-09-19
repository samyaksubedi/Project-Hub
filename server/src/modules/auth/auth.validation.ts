import { z } from 'zod';
export const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const password = z
  .string()
  .min(10, 'Use at least 10 characters for your password.')
  .max(72)
  .refine(
    (v) => Buffer.byteLength(v, 'utf8') <= 72,
    'Password must be at most 72 bytes.',
  );
export const registerSchema = z
  .object({ name: z.string().trim().min(2).max(80), email, password })
  .strict();
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(200) })
  .strict();
export const emailSchema = z.object({ email }).strict();
export const tokenSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid or expired link.'),
  })
  .strict();
export const resetSchema = tokenSchema.extend({ password });
