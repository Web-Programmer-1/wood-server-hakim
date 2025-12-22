/*
  Warnings:

  - You are about to drop the column `techSpecs` on the `Machine` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Machine` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `Machine` table. All the data in the column will be lost.
  - Added the required column `name` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Machine" DROP COLUMN "techSpecs",
DROP COLUMN "title",
DROP COLUMN "visibility",
ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "shortDesc" TEXT,
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "thumbnailImage" TEXT;
