import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const example = await readFile(
  new URL("../.env.example", import.meta.url),
  "utf8",
);
const content = example
  .replace(
    "replace-with-a-random-secret-at-least-32-characters",
    randomBytes(48).toString("hex"),
  )
  .replace(
    "replace-with-a-different-random-secret-at-least-32-characters",
    randomBytes(48).toString("hex"),
  );
try {
  await writeFile(new URL("../.env", import.meta.url), content, { flag: "wx" });
  console.log("Created server/.env with unique development JWT secrets.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Kept existing server/.env.");
}
try {
  const client = await readFile(
    new URL("../../client/.env.example", import.meta.url),
    "utf8",
  );
  await writeFile(new URL("../../client/.env", import.meta.url), client, {
    flag: "wx",
  });
  console.log("Created client/.env.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Kept existing client/.env.");
}
