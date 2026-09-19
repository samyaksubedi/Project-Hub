import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
export const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
  githubUrl: true,
  linkedinUrl: true,
  portfolioUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
export const authRepository = {
  byEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  byId: (id: string) =>
    prisma.user.findUniqueOrThrow({
      where: { id },
      select: { ...publicUserSelect, email: true, emailVerified: true },
    }),
  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data }),
  token: (hash: string) => prisma.authToken.findUnique({ where: { hash } }),
  async replaceToken(
    userId: string,
    purpose: string,
    hash: string,
    expiresAt: Date,
  ) {
    // Serialize issuance per account so simultaneous resend requests cannot bypass the cooldown.
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId}::uuid FOR UPDATE`;
      const existing = await tx.authToken.findUnique({
        where: { userId_purpose: { userId, purpose } },
      });
      if (existing && existing.createdAt.getTime() > Date.now() - 60000)
        throw new AppError(
          429,
          'Please wait a minute before requesting another email.',
        );
      return tx.authToken.upsert({
        where: { userId_purpose: { userId, purpose } },
        create: { userId, purpose, hash, expiresAt },
        update: { hash, expiresAt, createdAt: new Date() },
      });
    });
  },
  removeToken: (hash: string) =>
    prisma.authToken.deleteMany({ where: { hash } }),
  async consumeToken(hash: string, purpose: string, passwordHash?: string) {
    return prisma.$transaction(async (tx) => {
      const token = await tx.authToken.findUnique({ where: { hash } });
      if (!token || token.purpose !== purpose || token.expiresAt <= new Date())
        throw new AppError(400, 'Invalid or expired link. Request a new one.');
      const consumed = await tx.authToken.deleteMany({
        where: { id: token.id, hash, expiresAt: { gt: new Date() } },
      });
      if (!consumed.count)
        throw new AppError(400, 'This link has already been used.');
      await tx.user.update({
        where: { id: token.userId },
        data: purpose === 'verify' ? { emailVerified: true } : { passwordHash },
      });
      if (purpose === 'reset')
        await tx.refreshSession.deleteMany({ where: { userId: token.userId } });
    });
  },
  session: (id: string) => prisma.refreshSession.findUnique({ where: { id } }),
  saveSession: (data: Prisma.RefreshSessionUncheckedCreateInput) =>
    prisma.refreshSession.create({ data }),
  removeSession: (tokenHash: string) =>
    prisma.refreshSession.deleteMany({ where: { tokenHash } }),
  async rotate(
    oldHash: string,
    data: Prisma.RefreshSessionUncheckedCreateInput,
  ) {
    await prisma.$transaction(async (tx) => {
      const old = await tx.refreshSession.deleteMany({
        where: {
          tokenHash: oldHash,
          userId: data.userId,
          expiresAt: { gt: new Date() },
        },
      });
      if (!old.count)
        throw new AppError(
          401,
          'Your session has expired. Please log in again.',
        );
      await tx.refreshSession.create({ data });
    });
  },
};
