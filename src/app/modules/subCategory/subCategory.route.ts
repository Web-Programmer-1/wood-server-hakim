import { Router } from "express";
import { SubCategoryController } from "./subCategory.controller";

import { UserRole } from "@prisma/client";
import { authGuard } from "../../middlewares/auth";
import { uploadSubCategoryImage } from "../../middlewares/UploadMachineImage";

const router = Router();




// Create SubCategory
router.post(
  "/",
  authGuard(UserRole.ADMIN),
  uploadSubCategoryImage,
  SubCategoryController.createSubCategory
);

// Get all SubCategories
router.get(
  "/",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  SubCategoryController.getSubCategories
);

router.get(
  "/:slug",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  SubCategoryController.getSingleSubCategory
);

// Update SubCategory
router.patch(
  "/admin/:id",
  authGuard(UserRole.ADMIN),
  uploadSubCategoryImage,
  SubCategoryController.updateSubCategory
);

// Delete SubCategory
router.delete(
  "/admin/:id",
  authGuard(UserRole.ADMIN),
  SubCategoryController.deleteSubCategory
);

export const SubCategoryRoutes = router;