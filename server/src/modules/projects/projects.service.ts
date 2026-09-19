import { projectsRepository as repo } from './projects.repository.js';
import {
  categories,
  type ProjectInput,
  type ProjectQuery,
} from './projects.validation.js';
import { AppError } from '../../utils/errors.js';
export const projectsService = {
  async options() {
    return { categories, technologies: await repo.technologies() };
  },
  list: (query: ProjectQuery, userId?: string) => repo.list(query, userId),
  async get(id: string, userId?: string) {
    const project = await repo.get(id, userId);
    if (!project) throw new AppError(404, 'Project not found.');
    return project;
  },
  async owned(id: string, userId: string) {
    const project = await this.get(id, userId);
    if (project.ownerId !== userId)
      throw new AppError(403, 'Only the project owner can make this change.');
    return project;
  },
  async create(userId: string, data: ProjectInput) {
    if (!(await repo.membersExist(data.memberIds)))
      throw new AppError(
        400,
        'Team members must be registered, verified students.',
      );
    return this.get(await repo.create(userId, data), userId);
  },
  async update(id: string, userId: string, data: Partial<ProjectInput>) {
    await this.owned(id, userId);
    if (data.memberIds && !(await repo.membersExist(data.memberIds)))
      throw new AppError(
        400,
        'Team members must be registered, verified students.',
      );
    await repo.update(id, userId, data);
    return this.get(id, userId);
  },
  async remove(id: string, userId: string) {
    await this.owned(id, userId);
    await repo.remove(id, userId);
    return { message: 'Project deleted.' };
  },
};
