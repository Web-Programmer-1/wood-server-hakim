import { Router } from "express";
import { ShadhinotaController } from "./shadhinota.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";
import { uploadShadhinotaImages } from "../../middlewares/uploadShadhinotaImages";
import { uploadShadhinotaVideo } from "../../middlewares/uploadShadhinotaVideo";

const router = Router();

// Settings content — CONTENT scope.
const contentGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SOCIAL_MANAGER
);

router.post(
  "/",
  contentGuard,
  uploadShadhinotaImages.array("images", 20),
  ShadhinotaController.create
);

router.get("/", ShadhinotaController.getAll);
router.get("/video", ShadhinotaController.getVideo);
router.get("/:id", ShadhinotaController.getById);

router.patch("/:id", contentGuard, ShadhinotaController.update);

router.delete("/:id", contentGuard, ShadhinotaController.delete);

router.post(
  "/:id/images",
  contentGuard,
  uploadShadhinotaImages.array("images", 20),
  ShadhinotaController.addImages
);

router.delete(
  "/images/:imageId",
  contentGuard,
  ShadhinotaController.deleteImage
);

router.post(
  "/video",
  contentGuard,
  uploadShadhinotaVideo,
  ShadhinotaController.uploadVideo
);

router.delete(
  "/video",
  contentGuard,
  ShadhinotaController.deleteVideo
);

export const ShadhinotaRoutes = router;
