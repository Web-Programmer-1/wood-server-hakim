import multer from "multer";
import { NextFunction, Request, Response } from "express";

// =====================================================================
// Inquiry quotation attachments.
//
// Unlike product/blog images (which are persisted to Backblaze S3), files
// attached to a quotation reply are transient — they only need to live long
// enough to be streamed into the outgoing email. So we keep them in memory
// (Buffer) and hand them straight to nodemailer's `attachments` option.
// Nothing is written to disk or the bucket.
// =====================================================================

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

// Common business document / image types an admin would attach to a quote.
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const inquiryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
  // Field name the client appends each file under: "attachments".
}).array("attachments", MAX_FILES);

/**
 * Wraps the multer middleware so upload problems (too many files, oversized
 * file, unsupported type) come back as a clean 400 instead of bubbling up as a
 * 500 from the global error handler.
 */
export const uploadInquiryAttachments = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  inquiryUpload(req, res, (err: any) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      let message = "File upload failed";
      if (err.code === "LIMIT_FILE_SIZE") {
        message = `Each attachment must be ${MAX_FILE_SIZE / (1024 * 1024)}MB or smaller`;
      } else if (err.code === "LIMIT_FILE_COUNT") {
        message = `You can attach at most ${MAX_FILES} files`;
      }
      return res.status(400).json({ success: false, message });
    }

    return res.status(400).json({
      success: false,
      message: err?.message || "Invalid attachment",
    });
  });
};
