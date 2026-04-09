import { Router } from "express";
import {  MachineController } from "./machine.controller";

import { uploadMachineVideo } from "../../middlewares/uploadMachineVideo";
import { uploadMachineGalleryImages } from "../../middlewares/uploadMachineGalleryImages";
import { uploadMachineCreate } from "../../middlewares/UploadMachineImage";

const router = Router();


router.get('/', MachineController.getMachines);



router.get(
  "/machine-images",
  MachineController.getAllMachineImages
);
router.get("/featured", MachineController.getFeaturedMachines);
router.get("/search", MachineController.searchMachines);
router.get("/:slug", MachineController.getMachineBySlug);

router.get("/:slug/download-spec", MachineController.downloadMachineSpecPdf);

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



//  ----------- API For Machine Images ----------------

router.post(
  "/admin/:id/images",
//   authGuard(UserRole.ADMIN),
  uploadMachineGalleryImages.array("images", 10),
  MachineController.uploadMachineImages
);


router.patch(
  "/machine-images/:id",
  uploadMachineGalleryImages.single("image"),
  MachineController.updateMachineImage
);








router.delete(
  "/machine-images/:id",
  // authGuard(UserRole.ADMIN),
  MachineController.deleteMachineImage
);





// --------------- API For Machine Video ----------------


router.post(
  "/admin/:id/video",
//   authGuard(UserRole.ADMIN),
  uploadMachineVideo,
  MachineController.uploadMachineVideo
);



router.get(
  "/images/videos",
  MachineController.getAllMachineVideosController
);




router.patch(
  "/images/videos/:id",
  uploadMachineVideo,
  MachineController.updateMachineVideo
);



router.delete(
  "/images/videos/:id",
  MachineController.deleteMachineVideo
);









export const MachineRoutes = router;
