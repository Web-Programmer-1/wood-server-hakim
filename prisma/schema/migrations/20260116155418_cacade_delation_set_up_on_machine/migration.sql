-- DropForeignKey
ALTER TABLE "MachineImage" DROP CONSTRAINT "MachineImage_machineId_fkey";

-- DropForeignKey
ALTER TABLE "MachineVideo" DROP CONSTRAINT "MachineVideo_machineId_fkey";

-- AddForeignKey
ALTER TABLE "MachineImage" ADD CONSTRAINT "MachineImage_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineVideo" ADD CONSTRAINT "MachineVideo_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
