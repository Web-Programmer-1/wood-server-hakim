-- AlterTable
ALTER TABLE "Machine"
ADD COLUMN "customerImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "fileUploadLink" TEXT,
ADD COLUMN "videoYoutubeLink" TEXT;
