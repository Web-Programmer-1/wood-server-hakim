/*
  Warnings:

  - You are about to drop the column `label` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `workingLengthMm` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `workingWidthMm` on the `ProductVariant` table. All the data in the column will be lost.
  - Added the required column `customSize` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProductVariant_workingLengthMm_idx";

-- DropIndex
DROP INDEX "ProductVariant_workingWidthMm_idx";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "label",
DROP COLUMN "workingLengthMm",
DROP COLUMN "workingWidthMm",
ADD COLUMN     "customSize" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ProductVariant_customSize_idx" ON "ProductVariant"("customSize");
