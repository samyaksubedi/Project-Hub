import { Router } from 'express';
import * as controller from './projects.controller.js';
import { setLike } from '../likes/likes.controller.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.js';
import { limiter } from '../../middlewares/limits.js';
export const projectRoutes = Router();
const aiLimit = limiter(10);
projectRoutes.get('/options', controller.options);
projectRoutes.get('/', optionalAuth, controller.list);
projectRoutes.post('/', authenticate, controller.create);
projectRoutes.post(
  '/generate-description',
  authenticate,
  aiLimit,
  controller.generate,
);
projectRoutes.post(
  '/:id/generate-description',
  authenticate,
  aiLimit,
  controller.generate,
);
projectRoutes.get('/:id', optionalAuth, controller.get);
projectRoutes.patch('/:id', authenticate, controller.update);
projectRoutes.delete('/:id', authenticate, controller.remove);
projectRoutes.post('/:id/like', authenticate, setLike);
projectRoutes.delete('/:id/like', authenticate, setLike);
