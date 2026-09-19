import { prisma } from '../../lib/prisma.js';
export const likesRepository = {
  add: (projectId: string, userId: string) =>
    prisma.like.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId },
      update: {},
    }),
  remove: (projectId: string, userId: string) =>
    prisma.like.deleteMany({ where: { projectId, userId } }),
  count: (projectId: string) => prisma.like.count({ where: { projectId } }),
};
