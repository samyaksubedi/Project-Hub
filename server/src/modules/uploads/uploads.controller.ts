import type { RequestHandler } from "express";
import { uploadsService } from "./uploads.service.js";
import { currentUser } from "../../middlewares/auth.js";
import { idSchema } from "../../utils/validation.js";
export const upload: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json({
      success: true,
      data: await uploadsService.upload(currentUser(req), req.file),
    });
};
export const remove: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await uploadsService.remove(
      currentUser(req),
      idSchema.parse(req.params.id),
    ),
  });
};