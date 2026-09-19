import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import type { z } from 'zod';
import { authRepository as repo } from './auth.repository.js';
import { registerSchema } from './auth.validation.js';
import { mailService } from '../../lib/mail.js';
import { AppError } from '../../utils/errors.js';
import {
  hashToken,
  issueTokens,
  randomToken,
  verifyToken,
} from '../../utils/tokens.js';

async function sendToken(
  userId: string,
  email: string,
  purpose: 'verify' | 'reset',
) {
  const token = randomToken();
  await repo.replaceToken(
    userId,
    purpose,
    hashToken(token),
    new Date(Date.now() + 30 * 60000),
  );
  try {
    await mailService.send(email, purpose, token);
  } catch (error) {
    await repo.removeToken(hashToken(token));
    if (error instanceof AppError) throw error;
    throw new AppError(
      503,
      'Email could not be delivered. Please try requesting a new link.',
    );
  }
}
const genericMessage =
  'If the account is eligible, an email will arrive shortly.';
export const authService = {
  async register(data: z.infer<typeof registerSchema>) {
    if (await repo.byEmail(data.email))
      throw new AppError(
        409,
        'An account with this email already exists. Log in or request a verification link.',
      );
    const username = `${
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32) || 'student'
    }-${randomBytes(4).toString('hex')}`;
    const user = await repo.create({
      name: data.name,
      email: data.email,
      username,
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    try {
      await sendToken(user.id, user.email, 'verify');
    } catch (error) {
      if (error instanceof AppError)
        throw new AppError(
          error.status,
          `Your account was created, but ${error.message.charAt(0).toLowerCase()}${error.message.slice(1)} Use Resend verification after email is configured.`,
        );
      throw error;
    }
    return { message: 'Check your email to verify your account.' };
  },
  async requestEmail(email: string, purpose: 'verify' | 'reset') {
    const user = await repo.byEmail(email);
    if (user && (purpose === 'reset' || !user.emailVerified)) {
      try {
        await sendToken(user.id, email, purpose);
      } catch {
        /* Uniform response prevents enumeration; delivery failure is logged without account data. */ console.warn(
          'Account email request could not be sent.',
        );
      }
    }
    return { message: genericMessage };
  },
  async verify(token: string) {
    await repo.consumeToken(hashToken(token), 'verify');
    return { message: 'Email verified. You can now log in.' };
  },
  async reset(token: string, password: string) {
    await repo.consumeToken(
      hashToken(token),
      'reset',
      await bcrypt.hash(password, 12),
    );
    return { message: 'Password updated. Please log in.' };
  },
  async login(email: string, password: string) {
    const user = await repo.byEmail(email);
    // The fixed hash keeps nonexistent-account checks on the password-hashing path.
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ??
        '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
    );
    if (!user || !valid)
      throw new AppError(401, 'Email or password is incorrect.');
    if (!user.emailVerified)
      throw new AppError(403, 'Please verify your email before logging in.');
    const tokens = issueTokens(user.id);
    await repo.saveSession({
      id: tokens.sessionId,
      userId: user.id,
      tokenHash: hashToken(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
    });
    return { ...tokens, user: await repo.byId(user.id) };
  },
  async refresh(token: string) {
    const { userId } = verifyToken(token, 'refresh');
    const tokens = issueTokens(userId);
    await repo.rotate(hashToken(token), {
      id: tokens.sessionId,
      userId,
      tokenHash: hashToken(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
    });
    return { ...tokens, user: await repo.byId(userId) };
  },
  async logout(token?: string) {
    if (token) await repo.removeSession(hashToken(token));
    return { message: 'Logged out.' };
  },
  me: repo.byId,
};
