import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const randomToken = () => randomBytes(32).toString("hex");
export function issueTokens(userId: string) {
  const sessionId = randomUUID();
  const options = {
    algorithm: "HS256" as const,
    issuer: "projecthub",
    audience: "projecthub-client",
    subject: userId,
  };
  return {
    sessionId,
    accessToken: jwt.sign(
      { kind: "access", sid: sessionId },
      env.JWT_ACCESS_SECRET,
      { ...options, expiresIn: "15m" },
    ),
    refreshToken: jwt.sign(
      { kind: "refresh", sid: sessionId },
      env.JWT_REFRESH_SECRET,
      { ...options, expiresIn: "7d" },
    ),
    expiresAt: new Date(Date.now() + 7 * 86400000),
  };
}
export function verifyToken(token: string, kind: "access" | "refresh") {
  try {
    const data = jwt.verify(
      token,
      kind === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET,
      {
        algorithms: ["HS256"],
        issuer: "projecthub",
        audience: "projecthub-client",
      },
    );
    if (
      typeof data === "string" ||
      data.kind !== kind ||
      typeof data.sub !== "string" ||
      typeof data.sid !== "string"
    )
      throw new Error();
    return { userId: data.sub, sessionId: data.sid };
  } catch {
    throw new AppError(401, "Your session has expired. Please log in again.");
  }
}