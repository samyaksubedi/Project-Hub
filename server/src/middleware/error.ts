import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "../utils/errors.js";
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        success: false,
        message: error.issues[0]?.message || "Invalid input",
        errors: error.flatten(),
      });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof MulterError) {
    res
      .status(400)
      .json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Images must be smaller than 5 MB."
            : "Invalid upload.",
      });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res
        .status(409)
        .json({ success: false, message: "This record already exists." });
      return;
    }
    if (["P2025", "P2003"].includes(error.code)) {
      res
        .status(404)
        .json({
          success: false,
          message: "The requested record was not found.",
        });
      return;
    }
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ success: false, message: "Invalid JSON." });
    return;
  }
  console.error(
    "Request failed:",
    error instanceof Error ? error.name : "Unknown error",
  );
  res
    .status(500)
    .json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
};