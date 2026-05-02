


import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { s3Storage } from "../../config/aws.config";
import {
  MACHINE_FILE_ACCEPT_MIMES,
  MACHINE_FILE_MAX_BYTES,
  MACHINE_IMAGE_MAX_BYTES,
} from "../../config/machineUploadLimits";

const FILE_UPLOAD_FIELD = "fileUpload";

export const uploadMachineCreate = multer({
  storage: s3Storage({
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");
      const folder = file.fieldname === FILE_UPLOAD_FIELD ? "machines/files" : "machines";
      cb(null, `${folder}/${randomName}.${ext}`);
    },
  }),
  limits: { fileSize: Math.max(MACHINE_IMAGE_MAX_BYTES, MACHINE_FILE_MAX_BYTES) },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === FILE_UPLOAD_FIELD) {
      if (!MACHINE_FILE_ACCEPT_MIMES.includes(file.mimetype)) {
        cb(new Error("Unsupported file type. Allowed: PDF, Word, Excel, PowerPoint, ZIP, TXT, CSV."));
        return;
      }
      if (file.size && file.size > MACHINE_FILE_MAX_BYTES) {
        cb(new Error(`File too large. Max ${MACHINE_FILE_MAX_BYTES / (1024 * 1024)} MB.`));
        return;
      }
      cb(null, true);
      return;
    }
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "featureImages", maxCount: 20 },
  { name: "customerImages", maxCount: 20 },
  { name: FILE_UPLOAD_FIELD, maxCount: 1 },
]);







export const uploadCategoryImage = multer({
  storage: s3Storage({
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      cb(null, `categories/${randomName}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
}).single("thumbnail");







export const uploadSubCategoryImage = multer({
  storage: s3Storage({
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      cb(null, `sub-categories/${randomName}.${ext}`);
    },
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
}).single("thumbnailImage");