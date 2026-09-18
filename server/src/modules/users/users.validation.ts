import { z } from "zod";
import { optionalUrl } from "../../utils/validation.js";
export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    bio: z.string().trim().max(500),
    avatarUrl: optionalUrl,
    githubUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    portfolioUrl: optionalUrl,
  })
  .strict();
export const usernameSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);
export const searchSchema = z.object({
  search: z.string().trim().min(2).max(80),
});