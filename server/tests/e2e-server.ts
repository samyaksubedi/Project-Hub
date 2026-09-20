import "dotenv/config";
import nock from "nock";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://projecthub:projecthub@localhost:5434/projecthub_test?schema=public";
if (new URL(process.env.DATABASE_URL).pathname !== "/projecthub_test")
  throw new Error("E2E harness requires projecthub_test");
process.env.CLIENT_URL = "http://localhost:5174";
process.env.OPENAI_API_KEY = "test-only";
process.env.CLOUDINARY_CLOUD_NAME = "test-only";
process.env.CLOUDINARY_API_KEY = "test-only";
process.env.CLOUDINARY_API_SECRET = "test-only";
const { app } = await import("../src/app.js");
const { prisma } = await import("../src/lib/prisma.js");
const { mailService } = await import("../src/lib/mail.js");
const { imageProvider } = await import("../src/modules/uploads/cloudinary.js");
const express = (await import("express")).default;
const harness = express();
harness.use(express.json());
const messages = new Map<string, { purpose: string; token: string }>();
const images = new Map<string, Buffer>();
mailService.send = async (email, purpose, token) => {
  messages.set(email, { purpose, token });
};
imageProvider.upload = async (buffer) => {
  const id = randomUUID();
  images.set(id, buffer);
  return {
    public_id: id,
    secure_url: `http://localhost:5001/__test/images/${id}`,
    width: 1200,
    height: 800,
  } as Awaited<ReturnType<typeof imageProvider.upload>>;
};
imageProvider.remove = async (id) => {
  images.delete(id);
  return { result: "ok" };
};
nock("https://api.openai.com")
  .persist()
  .post("/v1/responses")
  .reply(200, {
    id: "resp_test",
    object: "response",
    created_at: 1,
    status: "completed",
    model: "gpt-4.1-mini",
    output: [
      {
        type: "message",
        id: "msg_test",
        status: "completed",
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "Campus Atlas helps students find study spaces and share resources across campus. Built with React and PostgreSQL, the project brings a searchable collection of student resources into one accessible interface.",
            annotations: [],
          },
        ],
      },
    ],
  });
nock("https://api.github.com")
  .persist()
  .get("/repos/student/campus-atlas")
  .reply(200, {
    name: "campus-atlas",
    description: "A student-built campus resource finder.",
    stargazers_count: 0,
    forks_count: 0,
    language: "TypeScript",
    updated_at: "2026-09-01T00:00:00Z",
    html_url: "https://github.com/student/campus-atlas",
    private: false,
  });
nock("https://api.github.com")
  .persist()
  .get("/repos/student/campus-atlas/languages")
  .reply(200, { TypeScript: 1000, CSS: 300 });
harness.get("/__test/mail", (req, res) => {
  const message = messages.get(String(req.query.email));
  res.status(message ? 200 : 404).json(message || {});
});
harness.get("/__test/images/:id", (req, res) => {
  const buffer = images.get(req.params.id);
  if (buffer) res.type("png").send(buffer);
  else res.sendStatus(404);
});
harness.post("/__test/reset", async (_req, res) => {
  await prisma.user.deleteMany();
  await prisma.technology.deleteMany();
  messages.clear();
  images.clear();
  res.json({ ok: true });
});
harness.use(app);
harness.listen(5001, "127.0.0.1", () =>
  console.log("Test-only API running on 5001"),
);
