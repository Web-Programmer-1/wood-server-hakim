/*
  Warnings:

  - Added the required column `availability` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brandType` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('IN_STOCK', 'PRE_ORDER', 'UPCOMING');

-- CreateEnum
CREATE TYPE "BrandType" AS ENUM ('LOCAL', 'PREMIUM', 'TRENDING', 'INDUSTRIAL', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('NEW_ARRIVAL', 'BEST_SELLER', 'FEATURED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availability" "AvailabilityStatus" NOT NULL,
ADD COLUMN     "basePrice" INTEGER NOT NULL,
ADD COLUMN     "brandType" "BrandType" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "discountPrice" INTEGER,
ADD COLUMN     "productType" "ProductType",
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visibility" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_productCategoryId_idx" ON "Product"("productCategoryId");

-- CreateIndex
CREATE INDEX "Product_availability_idx" ON "Product"("availability");

-- CreateIndex
CREATE INDEX "Product_brandType_idx" ON "Product"("brandType");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
