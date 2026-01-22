import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/aws.config"; // আপনার AWS কনফিগ পাথ

export const deleteFileFromS3 = async (fileUrl: string) => {
  if (!fileUrl) return;
  try {
    // URL থেকে Key বের করা (যেমন: landing/hero/xyz.jpg)
    const fileKey = fileUrl.split(".amazonaws.com/")[1];
    
    if (fileKey) {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      }));
      console.log(`🗑️ Rollback: Deleted ${fileKey}`);
    }
  } catch (error) {
    console.error("❌ Failed to delete file from S3:", error);
  }
};
