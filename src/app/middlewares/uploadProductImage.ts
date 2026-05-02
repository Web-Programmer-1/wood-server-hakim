import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";

import { Request } from "express";
import { s3Storage } from "../../config/aws.config";
import { PRODUCT_IMAGE_MAX_BYTES } from "../../config/productUploadLimits";

export const uploadProductImages = multer({
  storage: s3Storage({
    contentType: multerS3.AUTO_CONTENT_TYPE,

    metadata: (req: Request, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },

    key: (req: Request, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      // 🔥 Product image path
      cb(null, `products/${randomName}.${ext}`);
    },
  }),

  limits: {
    fileSize: PRODUCT_IMAGE_MAX_BYTES,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});
