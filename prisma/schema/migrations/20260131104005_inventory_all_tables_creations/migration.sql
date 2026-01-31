-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('PRODUCT', 'MACHINE');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'RESERVED', 'RELEASED', 'RETURN', 'DAMAGE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "MachineSerialStatus" AS ENUM ('AVAILABLE', 'SOLD', 'DAMAGED');

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "costPrice" INTEGER NOT NULL,
    "averageCost" INTEGER NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'IN_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineInventory" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 1,
    "costPrice" INTEGER NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'IN_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineSerial" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "status" "MachineSerialStatus" NOT NULL DEFAULT 'AVAILABLE',
    "soldOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineSerial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "productId" TEXT,
    "machineId" TEXT,
    "movementType" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAlert" (
    "id" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "openingStock" INTEGER NOT NULL,
    "closingStock" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_isDefault_idx" ON "Warehouse"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_sku_key" ON "ProductInventory"("sku");

-- CreateIndex
CREATE INDEX "ProductInventory_productId_idx" ON "ProductInventory"("productId");

-- CreateIndex
CREATE INDEX "ProductInventory_warehouseId_idx" ON "ProductInventory"("warehouseId");

-- CreateIndex
CREATE INDEX "ProductInventory_status_idx" ON "ProductInventory"("status");

-- CreateIndex
CREATE INDEX "ProductInventory_sku_idx" ON "ProductInventory"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_productId_warehouseId_key" ON "ProductInventory"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "MachineInventory_machineId_idx" ON "MachineInventory"("machineId");

-- CreateIndex
CREATE INDEX "MachineInventory_warehouseId_idx" ON "MachineInventory"("warehouseId");

-- CreateIndex
CREATE INDEX "MachineInventory_status_idx" ON "MachineInventory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MachineInventory_machineId_warehouseId_key" ON "MachineInventory"("machineId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "MachineSerial_serialNo_key" ON "MachineSerial"("serialNo");

-- CreateIndex
CREATE INDEX "MachineSerial_machineId_idx" ON "MachineSerial"("machineId");

-- CreateIndex
CREATE INDEX "MachineSerial_status_idx" ON "MachineSerial"("status");

-- CreateIndex
CREATE INDEX "MachineSerial_soldOrderId_idx" ON "MachineSerial"("soldOrderId");

-- CreateIndex
CREATE INDEX "StockMovement_itemType_idx" ON "StockMovement"("itemType");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_machineId_idx" ON "StockMovement"("machineId");

-- CreateIndex
CREATE INDEX "StockMovement_referenceId_idx" ON "StockMovement"("referenceId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryReservation_expiresAt_idx" ON "InventoryReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "InventoryReservation_productId_idx" ON "InventoryReservation"("productId");

-- CreateIndex
CREATE INDEX "InventoryReservation_cartId_idx" ON "InventoryReservation"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_cartId_productId_key" ON "InventoryReservation"("cartId", "productId");

-- CreateIndex
CREATE INDEX "InventoryAlert_itemType_idx" ON "InventoryAlert"("itemType");

-- CreateIndex
CREATE INDEX "InventoryAlert_itemId_idx" ON "InventoryAlert"("itemId");

-- CreateIndex
CREATE INDEX "InventoryAlert_isRead_idx" ON "InventoryAlert"("isRead");

-- CreateIndex
CREATE INDEX "InventoryAlert_createdAt_idx" ON "InventoryAlert"("createdAt");

-- CreateIndex
CREATE INDEX "InventorySnapshot_date_idx" ON "InventorySnapshot"("date");

-- CreateIndex
CREATE INDEX "InventorySnapshot_itemType_idx" ON "InventorySnapshot"("itemType");

-- CreateIndex
CREATE INDEX "InventorySnapshot_itemId_idx" ON "InventorySnapshot"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySnapshot_itemType_itemId_date_key" ON "InventorySnapshot"("itemType", "itemId", "date");

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineInventory" ADD CONSTRAINT "MachineInventory_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineInventory" ADD CONSTRAINT "MachineInventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineSerial" ADD CONSTRAINT "MachineSerial_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
