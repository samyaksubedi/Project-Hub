import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.js";
import { limiter } from "../../middlewares/limits.js";
import * as controller from "./uploads.controller.js";
export const uploadRoutes = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
});
uploadRoutes.post(
  "/",
  authenticate,
  limiter(30),
  upload.single("image"),
  controller.upload,
);
uploadRoutes.delete("/:id", authenticate, controller.remove);