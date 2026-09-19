import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../../config/env.js";
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});
export const imageProvider = {
  upload(buffer: Buffer, ownerId: string) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `projecthub/${ownerId}`,
            resource_type: "image",
            allowed_formats: ["jpg", "png", "webp"],
            transformation: [{ width: 1920, height: 1920, crop: "limit" }],
            timeout: 30000,
          },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Upload failed"));
            else resolve(result);
          },
        )
        .end(buffer);
    });
  },
  remove: (publicId: string) =>
    cloudinary.uploader.destroy(publicId, { invalidate: true }),
};