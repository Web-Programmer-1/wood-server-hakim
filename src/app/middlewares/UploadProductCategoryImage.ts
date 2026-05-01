import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { Request } from "express";
import { BUCKET_NAME, s3 } from "../../config/aws.config";

export const uploadProductCategoryImage = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req: Request, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      // ✅ Category image path
      cb(null, `product-categories/${randomName}.${ext}`);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});





