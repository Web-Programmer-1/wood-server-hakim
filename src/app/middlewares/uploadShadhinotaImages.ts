import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { Request } from "express";
import { s3Storage } from "../../config/aws.config";

export const uploadShadhinotaImages = multer({
  storage: s3Storage({
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req: Request, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req: Request, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");
      cb(null, `shadhinota/images/${randomName}.${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});
