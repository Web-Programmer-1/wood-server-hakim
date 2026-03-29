/*
  Warnings:

  - You are about to drop the column `workingLengthMm` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `workingWidthMm` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Product_workingLengthMm_idx";

-- DropIndex
DROP INDEX "Product_workingWidthMm_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "workingLengthMm",
DROP COLUMN "workingWidthMm";

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT,
    "workingWidthMm" INTEGER NOT NULL,
    "workingLengthMm" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "discountPrice" INTEGER,
    "imageUrl" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
