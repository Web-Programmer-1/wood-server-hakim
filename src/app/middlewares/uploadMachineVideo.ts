




import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { s3Storage } from "../../config/aws.config";
import { MACHINE_VIDEO_MAX_BYTES } from "../../config/machineUploadLimits";


export const uploadMachineVideo = multer({
  storage: s3Storage({
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");
      cb(null, `machine-videos/${randomName}.${ext}`);
    },
  }),

  limits: {
    fileSize: MACHINE_VIDEO_MAX_BYTES,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      cb(new Error("Only video files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("video");
