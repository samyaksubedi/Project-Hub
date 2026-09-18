import type { RequestHandler } from "express";
import { usersService } from "./users.service.js";
import {
  profileSchema,
  usernameSchema,
  searchSchema,
} from "./users.validation.js";
import { currentUser } from "../../middlewares/auth.js";
export const get: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await usersService.profile(usernameSchema.parse(req.params.username)),
  });
};
export const update: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await usersService.update(
      currentUser(req),
      profileSchema.parse(req.body),
    ),
  });
};
export const search: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await usersService.search(searchSchema.parse(req.query).search),
  });
};