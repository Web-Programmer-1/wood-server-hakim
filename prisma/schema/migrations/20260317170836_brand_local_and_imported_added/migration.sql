/*
  Warnings:

  - The values [PREMIUM,TRENDING,INDUSTRIAL,PROFESSIONAL] on the enum `BrandType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BrandType_new" AS ENUM ('IMPORTED', 'LOCAL');
ALTER TABLE "Product" ALTER COLUMN "brandType" TYPE "BrandType_new" USING ("brandType"::text::"BrandType_new");
ALTER TYPE "BrandType" RENAME TO "BrandType_old";
ALTER TYPE "BrandType_new" RENAME TO "BrandType";
DROP TYPE "public"."BrandType_old";
COMMIT;
