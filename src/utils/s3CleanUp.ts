import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, extractKeyFromUrl, s3 } from "../config/aws.config";

export const deleteFileFromS3 = async (fileUrl: string) => {
  if (!fileUrl) return;
  try {
    const fileKey = extractKeyFromUrl(fileUrl);

    if (fileKey) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
        }),
      );
      console.log(`🗑️ Rollback: Deleted ${fileKey}`);
    }
  } catch (error) {
    console.error("❌ Failed to delete file from S3:", error);
  }
};
