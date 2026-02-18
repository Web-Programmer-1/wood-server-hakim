import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import { Request } from "express";
import { s3 } from "../config/aws.config";

const createUploader = (folderName: string, allowedMimeTypes: string[], maxSize: number) => {
  return multer({
    storage: multerS3({
      s3: s3 as any,
      bucket: process.env.AWS_BUCKET_NAME!,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req: Request, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req: Request, file, cb) => {
        const ext = file.originalname.split(".").pop();
        const randomName = crypto.randomBytes(16).toString("hex");
    
        cb(null, `${folderName}/${randomName}.${ext}`);
      },
    }),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type! Allowed: ${allowedMimeTypes.join(", ")}`));
      }
    },
  });
};

// Hero Section Uploader (Image + Video)
export const uploadHeroMedia = createUploader(
  "landing/hero",
  ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"],
  50 * 1024 * 1024 // 50MB Max
);




export const uploadCompanyLogo = createUploader(
  "landing/companies", 
  ["image/jpeg", "image/png", "image/webp", "image/svg+xml"], 
  2 * 1024 * 1024 // 2MB Max
);




// landingVideo uploader
export const uploadLandingVideo = createUploader(
  "landing/videos",
  [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
  ],
  100 * 1024 * 1024 // 100MB
);


export const uploadLandingSlider = createUploader("landing/sliders", ["image/jpeg", "image/png", "image/webp"], 5 * 1024 * 1024);
