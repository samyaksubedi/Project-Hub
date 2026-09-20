import { expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { limiter } from "../src/middlewares/limits.js";
it("throttles repeated requests with a structured 429 response", async () => {
  const app = express();
  app.get("/", limiter(2), (_req, res) => {
    res.json({ ok: true });
  });
  expect((await request(app).get("/")).status).toBe(200);
  expect((await request(app).get("/")).status).toBe(200);
  const blocked = await request(app).get("/");
  expect(blocked.status).toBe(429);
  expect(blocked.body.success).toBe(false);
});
