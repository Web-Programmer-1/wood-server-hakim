-- CreateEnum
CREATE TYPE "LandingVideoSource" AS ENUM ('YOUTUBE', 'UPLOAD');

-- CreateTable
CREATE TABLE "landing_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "sourceType" "LandingVideoSource" NOT NULL,
    "youtubeUrl" TEXT,
    "videoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landing_videos_isActive_idx" ON "landing_videos"("isActive");

-- CreateIndex
CREATE INDEX "landing_videos_sourceType_idx" ON "landing_videos"("sourceType");
