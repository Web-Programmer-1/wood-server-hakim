

import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { s3 } from "../config/aws.config";
import { Request } from "express";

export const uploadCategoryImages = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.AWS_BUCKET_NAME!,

    contentType: multerS3.AUTO_CONTENT_TYPE, 

    metadata: (req: Request, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },

    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");
      cb(null, `categories/${randomName}.${ext}`);
    },
  }),
}).fields([
  { name: "image", maxCount: 1 },
  { name: "icon", maxCount: 1 },
]);
