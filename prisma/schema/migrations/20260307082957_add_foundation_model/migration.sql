-- CreateTable
CREATE TABLE "foundation_stories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cardImageUrl" TEXT NOT NULL,
    "videoType" TEXT,
    "youtubeUrl" TEXT,
    "videoUrl" TEXT,
    "galleryImages" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foundation_stories_slug_key" ON "foundation_stories"("slug");

-- CreateIndex
CREATE INDEX "foundation_stories_slug_idx" ON "foundation_stories"("slug");

-- CreateIndex
CREATE INDEX "foundation_stories_sortOrder_idx" ON "foundation_stories"("sortOrder");

-- CreateIndex
CREATE INDEX "foundation_stories_videoType_idx" ON "foundation_stories"("videoType");
