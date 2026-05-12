import { Router } from "express";
import { uploadTestimonialAssets } from "../../middlewares/UploadServicesBanner";
import { TestimonialController } from "./testimoniral.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Testimonials are part of site CONTENT (settings).
const contentGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SOCIAL_MANAGER
);

// Read-only routes need to be reachable by all staff + customers viewing the
// public site. Public testimonials are served via the read endpoints below;
// we keep them open for now to preserve existing public-page behavior.

router.post("/", contentGuard, uploadTestimonialAssets, TestimonialController.create);

router.get("/", TestimonialController.getAll);

router.get("/:id", TestimonialController.getById);

router.patch(
  "/:id",
  contentGuard,
  uploadTestimonialAssets,
  TestimonialController.update
);


router.delete("/:id", contentGuard, TestimonialController.delete);


export const TestimonialRoutes = router;
