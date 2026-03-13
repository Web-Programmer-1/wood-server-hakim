-- CreateTable
CREATE TABLE "shadhinota_uploaded_videos" (
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shadhinota_uploaded_videos_pkey" PRIMARY KEY ("key")
);
