import { Router } from "express";
import {  MachineController } from "./machine.controller";

import { uploadMachineVideo } from "../../middlewares/uploadMachineVideo";
import { uploadMachineGalleryImages } from "../../middlewares/uploadMachineGalleryImages";
import { uploadMachineCreate } from "../../middlewares/UploadMachineImage";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Machine management is part of the OPS scope: SUPER_ADMIN / ADMIN / MANAGER.
const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);


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
  opsGuard,
  uploadMachineCreate,
  MachineController.createMachine
);





router.patch(
  "/admin/:id",
  opsGuard,
  uploadMachineCreate,
  MachineController.updateMachine
);


router.patch(
  "/admin/:id/status",
  opsGuard,
  MachineController.updateMachineStatus
);







router.delete(
  "/admin/:id",
  opsGuard,
  MachineController.deleteMachine
);



//  ----------- API For Machine Images ----------------

router.post(
  "/admin/:id/images",
  opsGuard,
  uploadMachineGalleryImages.array("images", 10),
  MachineController.uploadMachineImages
);


router.patch(
  "/machine-images/:id",
  opsGuard,
  uploadMachineGalleryImages.single("image"),
  MachineController.updateMachineImage
);




router.delete(
  "/machine-images/:id",
  opsGuard,
  MachineController.deleteMachineImage
);





// --------------- API For Machine Video ----------------


router.post(
  "/admin/:id/video",
  opsGuard,
  uploadMachineVideo,
  MachineController.uploadMachineVideo
);


// Multipart (direct-to-S3) upload — used for large videos
router.post(
  "/admin/:id/video/multipart/initiate",
  opsGuard,
  MachineController.initiateMachineVideoMultipart
);

router.post(
  "/admin/:id/video/multipart/sign-part",
  opsGuard,
  MachineController.signMachineVideoPart
);

router.post(
  "/admin/:id/video/multipart/complete",
  opsGuard,
  MachineController.completeMachineVideoMultipart
);

router.post(
  "/admin/:id/video/multipart/abort",
  opsGuard,
  MachineController.abortMachineVideoMultipart
);



router.get(
  "/images/videos",
  MachineController.getAllMachineVideosController
);




router.patch(
  "/images/videos/:id",
  opsGuard,
  uploadMachineVideo,
  MachineController.updateMachineVideo
);



router.delete(
  "/images/videos/:id",
  opsGuard,
  MachineController.deleteMachineVideo
);









export const MachineRoutes = router;
