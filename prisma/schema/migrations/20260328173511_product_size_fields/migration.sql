-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "workingLengthMm" INTEGER,
ADD COLUMN     "workingWidthMm" INTEGER;

-- CreateIndex
CREATE INDEX "Product_workingLengthMm_idx" ON "Product"("workingLengthMm");

-- CreateIndex
CREATE INDEX "Product_workingWidthMm_idx" ON "Product"("workingWidthMm");
