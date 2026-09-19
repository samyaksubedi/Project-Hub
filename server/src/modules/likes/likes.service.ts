import { likesRepository as repo } from "./likes.repository.js";
import { projectsService } from "../projects/projects.service.js";
export const likesService = {
  async set(projectId: string, userId: string, liked: boolean) {
    await projectsService.get(projectId);
    if (liked) await repo.add(projectId, userId);
    else await repo.remove(projectId, userId);
    return { liked, likeCount: await repo.count(projectId) };
  },
};