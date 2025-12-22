import { Router } from "express";
import { MachineController } from "./machine.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { uploadMachineVideo } from "../../middlewares/uploadMachineVideo";
import { uploadProductImages } from "../../middlewares/uploadProductImage";
import { uploadMachineCreate } from "../../middlewares/UploadMachineImage";

const router = Router();

router.get("/", MachineController.getMachines);
router.get("/featured", MachineController.getFeaturedMachines);
router.get("/search", MachineController.searchMachines);
router.get("/:slug", MachineController.getMachineBySlug);
router.get("/:slug/related", MachineController.getRelatedMachines);



router.post(
  "/admin",
  uploadMachineCreate,
  MachineController.createMachine
);





router.patch(
  "/admin/:id",
//   authGuard(UserRole.ADMIN),
  MachineController.updateMachine
);

router.patch(
  "/admin/:id/status",
//   authGuard(UserRole.ADMIN),
  MachineController.updateMachineStatus
);

router.delete(
  "/admin/:id",
//   authGuard(UserRole.ADMIN),
  MachineController.deleteMachine
);

router.post(
  "/admin/:id/images",
//   authGuard(UserRole.ADMIN),
  uploadProductImages.array("images", 10),
  MachineController.uploadMachineImages
);

router.post(
  "/admin/:id/video",
//   authGuard(UserRole.ADMIN),
  uploadMachineVideo,
  MachineController.uploadMachineVideo
);

router.delete(
  "/admin/:id/images/:imageId",
//   authGuard(UserRole.ADMIN),
  MachineController.deleteMachineImage
);

export const MachineRoutes = router;
