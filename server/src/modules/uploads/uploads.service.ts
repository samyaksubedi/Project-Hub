import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { uploadsRepository as repo } from "./uploads.repository.js";
import { imageProvider } from "./cloudinary.js";
function configured() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  )
    throw new AppError(
      503,
      "Image uploads are not configured yet. You can save your project and add screenshots later.",
    );
}
export const uploadsService = {
  async upload(userId: string, file?: Express.Multer.File) {
    if (!file) throw new AppError(400, "Choose a PNG, JPG, or WebP image.");
    const b = file.buffer;
    const png = b
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = b[0] === 255 && b[1] === 216 && b[2] === 255;
    const webp =
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP";
    if (!png && !jpg && !webp)
      throw new AppError(400, "Only PNG, JPG, and WebP images are supported.");
    configured();
    let uploaded;
    try {
      uploaded = await imageProvider.upload(b, userId);
    } catch {
      throw new AppError(502, "Image upload failed. Please try again.");
    }
    try {
      return await repo.create({
        ownerId: userId,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
      });
    } catch (error) {
      await imageProvider.remove(uploaded.public_id).catch(() => undefined);
      throw error;
    }
  },
  async remove(userId: string, id: string) {
    const upload = await repo.get(id);
    if (!upload) throw new AppError(404, "Image not found.");
    if (upload.ownerId !== userId)
      throw new AppError(403, "You can only delete your own images.");
    configured();
    try {
      await imageProvider.remove(upload.publicId);
    } catch {
      throw new AppError(502, "Image could not be removed. Try again.");
    }
    await repo.remove(id);
    return { message: "Image deleted." };
  },
};