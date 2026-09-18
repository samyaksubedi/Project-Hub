import { usersRepository as repo } from "./users.repository.js";
import { AppError } from "../../utils/errors.js";
export const usersService = {
  async profile(username: string) {
    const user = await repo.byUsername(username);
    if (!user) throw new AppError(404, "Student not found.");
    const { _count, ...profile } = user;
    return {
      ...profile,
      projectCount: _count.projects,
      likesReceived: await repo.likesReceived(user.id),
    };
  },
  update: repo.update,
  search: repo.search,
};