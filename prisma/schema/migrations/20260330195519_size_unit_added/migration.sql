/*
  Warnings:

  - Added the required column `sizeUnit` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SizeUnit" AS ENUM ('MM', 'FT');

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "sizeUnit" "SizeUnit" NOT NULL;
