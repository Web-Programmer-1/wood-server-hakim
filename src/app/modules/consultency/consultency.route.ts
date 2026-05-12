import { Router } from "express";
import { uploadConsultencyBanner } from "../../middlewares/UploadServicesBanner";
import { ConsultencyBannerController } from "./consultency.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/",
    authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
    uploadConsultencyBanner, ConsultencyBannerController.create);
router.get("/", ConsultencyBannerController.getAll);
router.get("/:id",
       authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
    ConsultencyBannerController.getById);
router.patch("/:id", 
       authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
    uploadConsultencyBanner, ConsultencyBannerController.update);
router.delete("/:id",
       authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
    ConsultencyBannerController.delete);

export const ConsultencyBannerRoutes = router;