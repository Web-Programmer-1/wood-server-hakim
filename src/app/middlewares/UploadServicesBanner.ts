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
}).single("banner"); 






export const uploadTestimonialAssets = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      if (file.fieldname === "video") {
        cb(null, `testimonials/videos/${randomName}.${ext}`);
      } else {
        cb(null, `testimonials/images/${randomName}.${ext}`);
      }
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) cb(new Error("Only image/video files are allowed"));
    else cb(null, true);
  },
}).any();






export const uploadConsultencyBanner = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      cb(null, `consultency-banners/${randomName}.${ext}`);
    },
  }),

  limits: { fileSize: 100 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
}).single("banner");





export const uploadFoundationStoryAssets = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.AWS_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const randomName = crypto.randomBytes(16).toString("hex");

      if (file.fieldname === "video") {
        cb(null, `foundation-stories/videos/${randomName}.${ext}`);
      } else if (file.fieldname === "cardImage") {
        cb(null, `foundation-stories/card-images/${randomName}.${ext}`);
      } else {
        cb(null, `foundation-stories/gallery-images/${randomName}.${ext}`);
      }
    },
  }),

  limits: { fileSize: 100 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      cb(new Error("Only image and video files are allowed"));
    } else {
      cb(null, true);
    }
  },
}).fields([
  { name: "cardImage", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "galleryImages", maxCount: 20 },
]);