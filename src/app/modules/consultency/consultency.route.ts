import { Router } from "express";
import { uploadConsultencyBanner } from "../../middlewares/UploadServicesBanner";
import { ConsultencyBannerController } from "./consultency.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/",
    authGuard(UserRole.ADMIN),
    uploadConsultencyBanner, ConsultencyBannerController.create);
router.get("/", ConsultencyBannerController.getAll);
router.get("/:id",
       authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
    ConsultencyBannerController.getById);
router.patch("/:id", 
       authGuard(UserRole.ADMIN),
    uploadConsultencyBanner, ConsultencyBannerController.update);
router.delete("/:id",
       authGuard(UserRole.ADMIN),
    ConsultencyBannerController.delete);

export const ConsultencyBannerRoutes = router;