import { Router } from "express";
import * as MachineController from "./machine.controller";
import { uploadCategoryImages } from "../../../utils/multer";
import { uploadMachineVideo } from "../../middlewares/uploadMachineVideo";

import { UserRole } from "@prisma/client";
import { authGuard } from "../../middlewares/auth";


const router = Router();

router.post("/",  authGuard(UserRole.ADMIN),  MachineController.createMachine);
router.get("/", MachineController.getMachineList);
router.get("/:id",  MachineController.getSingleMachine);
router.put("/:id", authGuard(UserRole.ADMIN), MachineController.updateMachine);
router.delete("/:id", authGuard(UserRole.ADMIN), MachineController.deleteMachine);


router.post(
  "/:id/images",  authGuard(UserRole.ADMIN),
  uploadCategoryImages,
  MachineController.addMachineImage
);
router.delete(
  "/images/:id",  authGuard(UserRole.ADMIN),
  MachineController.deleteMachineImage
);



router.post(
  "/:id/videos",
  uploadMachineVideo,  authGuard(UserRole.ADMIN),
  MachineController.addMachineVideo
);



router.delete(
  "/videos/:id", authGuard(UserRole.ADMIN),
  MachineController.deleteMachineVideo
);

export const machineRoutes = router;
