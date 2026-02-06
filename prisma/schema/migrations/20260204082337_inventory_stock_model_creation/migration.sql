/*
  Warnings:

  - You are about to drop the column `reservedQuantity` on the `ProductInventory` table. All the data in the column will be lost.
  - You are about to drop the column `stockQuantity` on the `ProductInventory` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `ProductInventory` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `itemType` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `machineId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `movementType` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the `InventoryAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventoryReservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventorySnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MachineInventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MachineSerial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Warehouse` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId]` on the table `ProductInventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currentQty` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousQty` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Made the column `productId` on table `StockMovement` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "InventoryReservation" DROP CONSTRAINT "InventoryReservation_cartId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryReservation" DROP CONSTRAINT "InventoryReservation_productId_fkey";

-- DropForeignKey
ALTER TABLE "MachineInventory" DROP CONSTRAINT "MachineInventory_machineId_fkey";

-- DropForeignKey
ALTER TABLE "MachineInventory" DROP CONSTRAINT "MachineInventory_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "MachineSerial" DROP CONSTRAINT "MachineSerial_machineId_fkey";

-- DropForeignKey
ALTER TABLE "ProductInventory" DROP CONSTRAINT "ProductInventory_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_machineId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- DropIndex
DROP INDEX "ProductInventory_productId_idx";

-- DropIndex
DROP INDEX "ProductInventory_productId_warehouseId_key";

-- DropIndex
DROP INDEX "ProductInventory_sku_idx";

-- DropIndex
DROP INDEX "ProductInventory_warehouseId_idx";

-- DropIndex
DROP INDEX "StockMovement_itemType_idx";

-- DropIndex
DROP INDEX "StockMovement_machineId_idx";

-- DropIndex
DROP INDEX "StockMovement_movementType_idx";

-- DropIndex
DROP INDEX "StockMovement_referenceId_idx";

-- AlterTable
ALTER TABLE "ProductInventory" DROP COLUMN "reservedQuantity",
DROP COLUMN "stockQuantity",
DROP COLUMN "warehouseId",
ADD COLUMN     "availableQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "damagedQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reservedQty" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "costPrice" DROP NOT NULL,
ALTER COLUMN "averageCost" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "createdBy",
DROP COLUMN "itemType",
DROP COLUMN "machineId",
DROP COLUMN "movementType",
DROP COLUMN "note",
ADD COLUMN     "currentQty" INTEGER NOT NULL,
ADD COLUMN     "inventoryId" TEXT NOT NULL,
ADD COLUMN     "previousQty" INTEGER NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "type" "StockMovementType" NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "productId" SET NOT NULL;

-- DropTable
DROP TABLE "InventoryAlert";

-- DropTable
DROP TABLE "InventoryReservation";

-- DropTable
DROP TABLE "InventorySnapshot";

-- DropTable
DROP TABLE "MachineInventory";

-- DropTable
DROP TABLE "MachineSerial";

-- DropTable
DROP TABLE "Warehouse";

-- DropEnum
DROP TYPE "InventoryItemType";

-- DropEnum
DROP TYPE "MachineSerialStatus";

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_productId_key" ON "ProductInventory"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_inventoryId_idx" ON "StockMovement"("inventoryId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "ProductInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
