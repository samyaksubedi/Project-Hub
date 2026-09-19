import type { RequestHandler } from 'express';
import { likesService } from './likes.service.js';
import { idSchema } from '../../utils/validation.js';
import { currentUser } from '../../middlewares/auth.js';
export const setLike: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await likesService.set(
      idSchema.parse(req.params.id),
      currentUser(req),
      req.method === 'POST',
    ),
  });
};
