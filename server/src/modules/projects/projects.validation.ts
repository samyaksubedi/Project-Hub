import { z } from 'zod';
import { idSchema, optionalUrl, pagination } from '../../utils/validation.js';
export const categories = [
  'AI / Machine Learning',
  'Web Development',
  'Mobile Development',
  'IoT',
  'Cybersecurity',
  'Data Science',
  'Game Development',
  'Other',
] as const;
const technologies = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((v) => v.toLowerCase()),
  )
  .max(15)
  .transform((v) => [...new Set(v)]);

export const projectSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().min(20).max(10000),
    category: z.enum(categories),
    semester: z.number().int().min(1).max(12),
    githubUrl: optionalUrl.refine(
      (v) => !v || /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(v),
      'Use a public GitHub repository URL.',
    ),
    demoUrl: optionalUrl,
    technologies: technologies.default([]),
    memberIds: z
      .array(idSchema)
      .max(12)
      .transform((v) => [...new Set(v)])
      .default([]),
    screenshotIds: z
      .array(idSchema)
      .max(6)
      .transform((v) => [...new Set(v)])
      .default([]),
  })
  .strict();
export const updateProjectSchema = projectSchema.partial();

export const projectQuery = z.object({
  ...pagination,
  search: z.string().trim().max(100).optional(),
  category: z.enum(categories).optional(),
  technology: z.string().trim().max(30).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  owner: z.string().max(64).optional(),
  sort: z.enum(['recent', 'popular']).default('recent'),
});

export const descriptionSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    category: z.enum(categories),
    technologies,
    description: z.string().trim().min(10).max(3000),
  })
  .strict();

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectQuery = z.infer<typeof projectQuery>;
