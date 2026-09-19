import type { RequestHandler } from "express";
import { verifyToken } from "../utils/tokens.js";
import { AppError } from "../utils/errors.js";
import { authRepository } from "../modules/auth/auth.repository.js";
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AppError(401, "Please log in to continue.");
  const data = verifyToken(token, "access");
  const session = await authRepository.session(data.sessionId);
  if (
    !session ||
    session.userId !== data.userId ||
    session.expiresAt < new Date()
  )
    throw new AppError(401, "Your session has expired. Please log in again.");
  req.userId = data.userId;
  next();
};
export const optionalAuth: RequestHandler = async (req, res, next) => {
  if (req.headers.authorization) return authenticate(req, res, next);
  next();
};
export const currentUser = (req: Express.Request) => {
  if (!req.userId) throw new AppError(401, "Please log in to continue.");
  return req.userId;
};