import { Router } from "express";
import { ServiceSectionController } from "./services.controller";
import { uploadServiceSectionBanner } from "../../middlewares/UploadServicesBanner";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Services live under site settings — CONTENT scope.
const contentGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SOCIAL_MANAGER
);


router.post(
  "/",
  contentGuard,
  uploadServiceSectionBanner,
  ServiceSectionController.create
);




router.get("/", ServiceSectionController.getAll);

// GET SINGLE
router.get("/:id", ServiceSectionController.getById);

// UPDATE (banner optional)
router.patch(
  "/:id",
  contentGuard,
  uploadServiceSectionBanner,
  ServiceSectionController.update
);

// DELETE
router.delete("/:id", contentGuard, ServiceSectionController.delete);




export const ServiceSectionRoutes = router;
