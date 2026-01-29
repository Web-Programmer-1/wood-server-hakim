/*
  Warnings:

  - You are about to drop the `MachineBooking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MachineBooking" DROP CONSTRAINT "MachineBooking_machineId_fkey";

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "bookedEmail" TEXT,
ADD COLUMN     "bookedName" TEXT,
ADD COLUMN     "bookedNote" TEXT,
ADD COLUMN     "bookedPhone" TEXT;

-- DropTable
DROP TABLE "MachineBooking";
