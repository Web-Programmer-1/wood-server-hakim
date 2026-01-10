/*
  Warnings:

  - You are about to drop the column `profileCompleted` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `user_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "profileCompleted",
DROP COLUMN "verificationStatus";

-- DropEnum
DROP TYPE "VerificationStatus";
