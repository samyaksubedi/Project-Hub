import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
const url = new URL(
  process.env.TEST_DATABASE_URL ||
    "postgresql://projecthub:projecthub@localhost:5434/projecthub_test",
);
if (url.pathname !== "/projecthub_test")
  throw new Error("Test database must be named projecthub_test.");
const admin = new URL(url);
admin.pathname = "/postgres";
const db = new PrismaClient({ datasourceUrl: admin.toString() });
try {
  await db.$executeRawUnsafe("CREATE DATABASE projecthub_test");
} catch (error) {
  if (!String(error.meta?.message).includes("already exists")) throw error;
} finally {
  await db.$disconnect();
}
execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url.toString() } },
);
