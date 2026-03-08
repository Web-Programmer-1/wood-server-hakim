-- CreateEnum
CREATE TYPE "FoundationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "foundation_stories" ADD COLUMN     "content" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "FoundationStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tags" TEXT[];
