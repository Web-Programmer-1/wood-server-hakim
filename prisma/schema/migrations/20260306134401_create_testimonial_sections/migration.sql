-- CreateTable
CREATE TABLE "testimonial_sections" (
    "id" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "description" TEXT,
    "personName" TEXT,
    "companyName" TEXT,
    "cardBgImageUrl" TEXT,
    "videoType" TEXT,
    "youtubeUrl" TEXT,
    "videoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonial_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonial_sections_sortOrder_idx" ON "testimonial_sections"("sortOrder");

-- CreateIndex
CREATE INDEX "testimonial_sections_videoType_idx" ON "testimonial_sections"("videoType");
