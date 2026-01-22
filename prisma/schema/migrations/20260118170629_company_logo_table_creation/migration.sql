/*
  Warnings:

  - You are about to drop the `Hero` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Hero";

-- CreateTable
CREATE TABLE "CompanyLogo" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "buttonText" TEXT,
    "logoImage" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_sections_pkey" PRIMARY KEY ("id")
);
