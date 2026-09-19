import type { RequestHandler } from 'express';
import { projectsService as service } from './projects.service.js';
import { aiService } from './ai.service.js';
import {
  projectSchema,
  updateProjectSchema,
  projectQuery,
  descriptionSchema,
} from './projects.validation.js';
import { idSchema } from '../../utils/validation.js';
import { currentUser } from '../../middlewares/auth.js';
export const list: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.list(projectQuery.parse(req.query), req.userId),
  });
};
export const get: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.get(idSchema.parse(req.params.id), req.userId),
  });
};
export const create: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.create(currentUser(req), projectSchema.parse(req.body)),
  });
};
export const update: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.update(
      idSchema.parse(req.params.id),
      currentUser(req),
      updateProjectSchema.parse(req.body),
    ),
  });
};
export const remove: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.remove(idSchema.parse(req.params.id), currentUser(req)),
  });
};
export const generate: RequestHandler = async (req, res) => {
  if (req.params.id)
    await service.owned(idSchema.parse(req.params.id), currentUser(req));
  res.json({
    success: true,
    data: await aiService.generate(descriptionSchema.parse(req.body)),
  });
};
export const options: RequestHandler = async (_req, res) => {
  res.json({ success: true, data: await service.options() });
};
