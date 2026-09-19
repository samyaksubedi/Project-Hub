import type { RequestHandler } from 'express';
import { z } from 'zod';
import { githubService, repositoryUrl } from './github.service.js';
export const repository: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await githubService.repository(
      z.object({ url: repositoryUrl }).parse(req.query).url,
    ),
  });
};
