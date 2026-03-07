import { Router } from "express";
import { uploadTestimonialAssets } from "../../middlewares/UploadServicesBanner";
import { TestimonialController } from "./testimoniral.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// CREATE
router.post("/",
    authGuard(UserRole.ADMIN),
    uploadTestimonialAssets, TestimonialController.create);

// GET ALL
router.get("/",

       authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
     TestimonialController.getAll);

router.get("/:id",
       authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
    TestimonialController.getById);

router.patch(
  "/:id",
     authGuard(UserRole.ADMIN),
  uploadTestimonialAssets,
  TestimonialController.update
);


router.delete("/:id",
       authGuard(UserRole.ADMIN),
    TestimonialController.delete);






export const TestimonialRoutes = router;