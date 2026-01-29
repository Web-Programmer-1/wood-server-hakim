/*
  Warnings:

  - Added the required column `listPrice` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "bookedQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "discountPrice" INTEGER,
ADD COLUMN     "listPrice" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "MachineBooking" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineBooking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MachineBooking" ADD CONSTRAINT "MachineBooking_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
