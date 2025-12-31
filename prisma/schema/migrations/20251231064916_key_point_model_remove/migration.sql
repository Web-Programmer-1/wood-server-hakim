/*
  Warnings:

  - You are about to drop the `ProductKeyPoint` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductKeyPoint" DROP CONSTRAINT "ProductKeyPoint_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "keyPoints" JSONB;

-- DropTable
DROP TABLE "ProductKeyPoint";

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
