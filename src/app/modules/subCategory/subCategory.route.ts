import { Router } from "express";
import { SubCategoryController } from "./subCategory.controller";

import { UserRole } from "@prisma/client";
import { authGuard } from "../../middlewares/auth";
import { uploadSubCategoryImage } from "../../middlewares/UploadMachineImage";

const router = Router();




// Create SubCategory
router.post(
  "/",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  uploadSubCategoryImage,
  SubCategoryController.createSubCategory
);

// Get all SubCategories
router.get(
  "/",
  SubCategoryController.getSubCategories
);

router.get(
  "/:slug",
  SubCategoryController.getSingleSubCategory
);

// Update SubCategory
router.patch(
  "/admin/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  uploadSubCategoryImage,
  SubCategoryController.updateSubCategory
);

// Delete SubCategory
router.delete(
  "/admin/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  SubCategoryController.deleteSubCategory
);

export const SubCategoryRoutes = router;