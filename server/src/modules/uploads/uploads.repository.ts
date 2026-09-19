import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
export const uploadsRepository = {
  create: (data: Prisma.ScreenshotUncheckedCreateInput) =>
    prisma.screenshot.create({ data }),
  get: (id: string) => prisma.screenshot.findUnique({ where: { id } }),
  remove: (id: string) => prisma.screenshot.delete({ where: { id } }),
};