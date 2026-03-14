-- CreateTable
CREATE TABLE "shadhinota_images" (
    "id" TEXT NOT NULL,
    "shadhinotaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadhinota_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadhinota_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitles" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shadhinota_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadhinota_uploaded_videos" (
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shadhinota_uploaded_videos_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "shadhinota_videos" (
    "id" TEXT NOT NULL,
    "shadhinotaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadhinota_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadhinota_images_shadhinotaId_idx" ON "shadhinota_images"("shadhinotaId");

-- CreateIndex
CREATE INDEX "shadhinota_images_sortOrder_idx" ON "shadhinota_images"("sortOrder");

-- CreateIndex
CREATE INDEX "shadhinota_sections_createdAt_idx" ON "shadhinota_sections"("createdAt");

-- CreateIndex
CREATE INDEX "shadhinota_sections_sortOrder_idx" ON "shadhinota_sections"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "shadhinota_videos_shadhinotaId_key" ON "shadhinota_videos"("shadhinotaId");

-- AddForeignKey
ALTER TABLE "shadhinota_images" ADD CONSTRAINT "shadhinota_images_shadhinotaId_fkey" FOREIGN KEY ("shadhinotaId") REFERENCES "shadhinota_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadhinota_videos" ADD CONSTRAINT "shadhinota_videos_shadhinotaId_fkey" FOREIGN KEY ("shadhinotaId") REFERENCES "shadhinota_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
