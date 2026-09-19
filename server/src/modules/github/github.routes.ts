import { Router } from 'express';
import { repository } from './github.controller.js';
import { limiter } from '../../middlewares/limits.js';
export const githubRoutes = Router();
githubRoutes.get('/repository', limiter(60), repository);
