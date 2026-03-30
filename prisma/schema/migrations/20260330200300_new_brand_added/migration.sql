/*
  Warnings:

  - You are about to drop the column `brandType` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Product_availability_idx";

-- DropIndex
DROP INDEX "Product_brandType_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "brandType",
ADD COLUMN     "brand" TEXT,
ALTER COLUMN "availability" DROP NOT NULL;

-- DropEnum
DROP TYPE "BrandType";

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
