import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import path from "path";
import { Request } from "express";
import { s3 } from "../../config/aws.config";

export const uploadProductImages = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req: Request, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const randomName = crypto.randomBytes(16).toString("hex");

      cb(null, `products/${randomName}${ext}`);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  fileFilter: (_req, file, cb) => {
    const allowedMime = ["image/jpeg", "image/png", "image/jpg"];
    const allowedExt = [".jpg", ".jpeg", ".png"];

    const mimeOk = allowedMime.includes(file.mimetype);
    const extOk = allowedExt.includes(
      path.extname(file.originalname).toLowerCase()
    );

    // ✅ Allow if ANY one matches (important for Postman)
    if (!mimeOk && !extOk) {
      return cb(
        new Error(
          `Invalid file type (${file.mimetype}). Only JPG/PNG images allowed`
        )
      );
    }

    cb(null, true);
  },
});





