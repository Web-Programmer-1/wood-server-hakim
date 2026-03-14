import { Router } from "express";
import { ShadhinotaController } from "./shadhinota.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";
import { uploadShadhinotaImages } from "../../middlewares/uploadShadhinotaImages";
import { uploadShadhinotaVideo } from "../../middlewares/uploadShadhinotaVideo";

const router = Router();

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  uploadShadhinotaImages.array("images", 20),
  ShadhinotaController.create
);

router.get("/", ShadhinotaController.getAll);
router.get("/video", ShadhinotaController.getVideo);
router.get("/:id", ShadhinotaController.getById);

router.patch("/:id", authGuard(UserRole.ADMIN), ShadhinotaController.update);

router.delete("/:id", authGuard(UserRole.ADMIN), ShadhinotaController.delete);

router.post(
  "/:id/images",
  authGuard(UserRole.ADMIN),
  uploadShadhinotaImages.array("images", 20),
  ShadhinotaController.addImages
);

router.delete(
  "/images/:imageId",
  authGuard(UserRole.ADMIN),
  ShadhinotaController.deleteImage
);

router.post(
  "/video",
  authGuard(UserRole.ADMIN),
  uploadShadhinotaVideo,
  ShadhinotaController.uploadVideo
);

router.delete(
  "/video",
  authGuard(UserRole.ADMIN),
  ShadhinotaController.deleteVideo
);

export const ShadhinotaRoutes = router;
