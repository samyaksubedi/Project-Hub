import type { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { publicUserSelect } from "../auth/auth.repository.js";
import type { profileSchema } from "./users.validation.js";
export const usersRepository = {
  byUsername: (username: string) =>
    prisma.user.findUnique({
      where: { username, emailVerified: true },
      select: { ...publicUserSelect, _count: { select: { projects: true } } },
    }),
  likesReceived: (ownerId: string) =>
    prisma.like.count({ where: { project: { ownerId } } }),
  update: (id: string, data: z.infer<typeof profileSchema>) =>
    prisma.user.update({ where: { id }, data, select: publicUserSelect }),
  search: (search: string) =>
    prisma.user.findMany({
      where: {
        emailVerified: true,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
        ],
      },
      select: publicUserSelect,
      take: 10,
      orderBy: { name: "asc" },
    }),
};