import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";

import { Request } from "express";
import { s3Storage } from "../../config/aws.config";
import { MACHINE_IMAGE_MAX_BYTES } from "../../config/machineUploadLimits";

/** Gallery + single-image update for machines (admin). */
export const uploadMachineGalleryImages = multer({
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

      cb(null, `machines/gallery/${randomName}.${ext}`);
    },
  }),

  limits: {
    fileSize: MACHINE_IMAGE_MAX_BYTES,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});
