/**
 * Machine media limits — keep in sync with
 * wood_client/src/components/admin/_MachineClient/upload.constants.ts
 */
export const MACHINE_IMAGE_MAX_BYTES = 100 * 1024 * 1024; // 100 MB
export const MACHINE_VIDEO_MAX_BYTES = 1024 * 1024 * 1024; // 1 GB
export const MACHINE_FILE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/** MIME types accepted for the machine downloadable file (brochure / spec sheet). */
export const MACHINE_FILE_ACCEPT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
];
