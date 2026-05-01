import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { BUCKET_NAME, s3 } from "../../config/aws.config";

export const uploadShadhinotaVideo = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");
      cb(null, `shadhinota/videos/${randomName}.${ext}`);
    },
  }),
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      cb(new Error("Only video files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("video");
