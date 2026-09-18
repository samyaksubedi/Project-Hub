import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),
  GITHUB_TOKEN: z.string().default(''),
});
export const env = schema.parse(process.env);
if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET)
  throw new Error('JWT secrets must differ');
if (
  env.JWT_ACCESS_SECRET.startsWith('replace-') ||
  env.JWT_REFRESH_SECRET.startsWith('replace-')
)
  throw new Error(
    'Generate JWT secrets with npm run setup:env or replace the example secrets.',
  );
