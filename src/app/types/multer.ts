export interface MulterS3File extends Express.Multer.File {
  location: string; // S3 public URL
  key: string;
  bucket: string;
}
