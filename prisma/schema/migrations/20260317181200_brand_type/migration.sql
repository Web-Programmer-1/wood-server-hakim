/*
  Warnings:

  - The values [IMPORTED] on the enum `BrandType` will be removed. If these variants are still used in the database, this will fail.
  - The values [NEW_ARRIVAL,BEST_SELLER,FEATURED] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BrandType_new" AS ENUM ('LOCAL', 'PREMIUM', 'TRENDING', 'INDUSTRIAL', 'PROFESSIONAL');
ALTER TABLE "Product" ALTER COLUMN "brandType" TYPE "BrandType_new" USING ("brandType"::text::"BrandType_new");
ALTER TYPE "BrandType" RENAME TO "BrandType_old";
ALTER TYPE "BrandType_new" RENAME TO "BrandType";
DROP TYPE "public"."BrandType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('IMPORTED', 'LOCAL');
ALTER TABLE "Product" ALTER COLUMN "productType" TYPE "ProductType_new" USING ("productType"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "public"."ProductType_old";
COMMIT;
