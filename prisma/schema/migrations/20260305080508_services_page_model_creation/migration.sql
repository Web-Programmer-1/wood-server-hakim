-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "description" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "service_sections" (
    "id" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "description" TEXT,
    "primaryBtnText" TEXT,
    "primaryBtnUrl" TEXT,
    "secondaryBtnText" TEXT,
    "secondaryBtnUrl" TEXT,
    "bgImageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_sections_sortOrder_idx" ON "service_sections"("sortOrder");

-- CreateIndex
CREATE INDEX "service_sections_createdAt_idx" ON "service_sections"("createdAt");
