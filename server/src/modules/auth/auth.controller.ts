import type { RequestHandler, Response } from 'express';
import { authService as service } from './auth.service.js';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  tokenSchema,
} from './auth.validation.js';
import { env } from '../../config/env.js';
import { currentUser } from '../../middlewares/auth.js';
import { AppError } from '../../utils/errors.js';
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
};
function sessionResponse(
  res: Response,
  data: Awaited<ReturnType<typeof service.login>>,
) {
  res.cookie('refreshToken', data.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 86400000,
  });
  res.json({
    success: true,
    data: { accessToken: data.accessToken, user: data.user },
  });
}
export const register: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.register(registerSchema.parse(req.body)),
  });
};
export const login: RequestHandler = async (req, res) => {
  const data = loginSchema.parse(req.body);
  sessionResponse(res, await service.login(data.email, data.password));
};
export const verify: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.verify(tokenSchema.parse(req.body).token),
  });
};
export const resend: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.requestEmail(
      emailSchema.parse(req.body).email,
      'verify',
    ),
  });
};
export const forgot: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.requestEmail(
      emailSchema.parse(req.body).email,
      'reset',
    ),
  });
};
export const reset: RequestHandler = async (req, res) => {
  const data = resetSchema.parse(req.body);
  res.json({
    success: true,
    data: await service.reset(data.token, data.password),
  });
};
export const refresh: RequestHandler = async (req, res) => {
  const token: unknown = req.cookies.refreshToken;
  if (typeof token !== 'string')
    throw new AppError(401, 'Please log in to continue.');
  sessionResponse(res, await service.refresh(token));
};
export const logout: RequestHandler = async (req, res) => {
  res.clearCookie('refreshToken', cookieOptions);
  res.json({
    success: true,
    data: await service.logout(
      typeof req.cookies.refreshToken === 'string'
        ? req.cookies.refreshToken
        : undefined,
    ),
  });
};
export const me: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await service.me(currentUser(req)) });
};
