import "dotenv/config";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://projecthub:projecthub@localhost:5434/projecthub_test?schema=public";
if (new URL(process.env.DATABASE_URL).pathname !== "/projecthub_test")
  throw new Error("Refusing to run destructive tests outside projecthub_test.");
process.env.JWT_ACCESS_SECRET = "test-access-secret-for-projecthub-tests-only";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-for-projecthub-tests-only";
