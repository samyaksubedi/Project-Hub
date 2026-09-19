import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { publicUserSelect } from '../auth/auth.repository.js';
import type { ProjectInput, ProjectQuery } from './projects.validation.js';
import { AppError } from '../../utils/errors.js';

const include = (userId?: string) => ({
  owner: { select: publicUserSelect },
  technologies: { orderBy: { name: 'asc' as const } },
  screenshots: { orderBy: { createdAt: 'asc' as const } },
  members: { include: { user: { select: publicUserSelect } } },
  _count: { select: { likes: true } },
  likes: {
    where: { userId: userId ?? '00000000-0000-0000-0000-000000000000' },
    select: { userId: true },
  },
});
type Included = Prisma.ProjectGetPayload<{
  include: ReturnType<typeof include>;
}>;
const present = ({ likes, _count, ...project }: Included) => ({
  ...project,
  likeCount: _count.likes,
  liked: likes.length > 0,
});
async function attachScreenshots(
  tx: Prisma.TransactionClient,
  projectId: string,
  ownerId: string,
  ids: string[],
) {
  const attached = await tx.screenshot.updateMany({
    where: {
      id: { in: ids },
      ownerId,
      OR: [{ projectId: null }, { projectId }],
    },
    data: { projectId },
  });
  if (attached.count !== ids.length)
    throw new AppError(
      400,
      'One or more screenshots are unavailable or belong to another project.',
    );
  await tx.screenshot.updateMany({
    where: { projectId, id: { notIn: ids } },
    data: { projectId: null },
  });
}
const techConnect = (names: string[]) =>
  names.map((name) => ({ where: { name }, create: { name } }));
export const projectsRepository = {
  async list(query: ProjectQuery, userId?: string) {
    const contains = (value: string) => ({
      contains: value,
      mode: 'insensitive' as const,
    });
    const where: Prisma.ProjectWhereInput = {
      category: query.category,
      semester: query.semester,
      ...(query.owner ? { owner: { username: query.owner } } : {}),
      ...(query.technology
        ? {
            technologies: {
              some: { name: { equals: query.technology, mode: 'insensitive' } },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: contains(query.search) },
              { description: contains(query.search) },
              { category: contains(query.search) },
              { technologies: { some: { name: contains(query.search) } } },
            ],
          }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        include: include(userId),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy:
          query.sort === 'popular'
            ? [
                { likes: { _count: 'desc' } },
                { createdAt: 'desc' },
                { id: 'desc' },
              ]
            : [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.project.count({ where }),
    ]);
    return {
      items: items.map(present),
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  },
  async get(id: string, userId?: string) {
    const p = await prisma.project.findUnique({
      where: { id },
      include: include(userId),
    });
    return p ? present(p) : null;
  },
  async membersExist(ids: string[]) {
    return (
      (await prisma.user.count({
        where: { id: { in: ids }, emailVerified: true },
      })) === ids.length
    );
  },
  async create(ownerId: string, data: ProjectInput) {
    return prisma.$transaction(async (tx) => {
      const { technologies, memberIds, screenshotIds, ...fields } = data;
      const project = await tx.project.create({
        data: {
          ...fields,
          ownerId,
          technologies: { connectOrCreate: techConnect(technologies) },
          members: {
            create: memberIds
              .filter((id) => id !== ownerId)
              .map((userId) => ({ userId })),
          },
        },
      });
      await attachScreenshots(tx, project.id, ownerId, screenshotIds);
      return project.id;
    });
  },
  async update(id: string, ownerId: string, data: Partial<ProjectInput>) {
    return prisma.$transaction(async (tx) => {
      const { technologies, memberIds, screenshotIds, ...fields } = data;
      await tx.project.update({
        where: { id, ownerId },
        data: {
          ...fields,
          ...(technologies
            ? {
                technologies: {
                  set: [],
                  connectOrCreate: techConnect(technologies),
                },
              }
            : {}),
          ...(memberIds
            ? {
                members: {
                  deleteMany: {},
                  create: memberIds
                    .filter((member) => member !== ownerId)
                    .map((userId) => ({ userId })),
                },
              }
            : {}),
        },
      });
      if (screenshotIds)
        await attachScreenshots(tx, id, ownerId, screenshotIds);
    });
  },
  remove: (id: string, ownerId: string) =>
    prisma.project.delete({ where: { id, ownerId } }),
  technologies: () =>
    prisma.technology.findMany({
      where: { projects: { some: {} } },
      orderBy: { name: 'asc' },
      take: 100,
      select: { name: true },
    }),
};
