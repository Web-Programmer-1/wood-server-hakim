import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { s3 } from "../../config/aws.config";

export const uploadServiceSectionBanner = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      cb(null, `service-sections/${randomName}.${ext}`);
    },
  }),

  limits: { fileSize: 100 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) cb(new Error("Only image files are allowed"));
    else cb(null, true);
  },
}).single("banner"); // ✅ banner image