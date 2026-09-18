import { Router } from "express";
import * as controller from "./users.controller.js";
import { authenticate } from "../../middlewares/auth.js";
export const userRoutes = Router();
userRoutes.get("/", authenticate, controller.search);
userRoutes.patch("/me", authenticate, controller.update);
userRoutes.get("/:username", controller.get);