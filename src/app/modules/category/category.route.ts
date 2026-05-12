

import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { uploadCategoryImage } from "../../middlewares/UploadMachineImage";

const router = Router();

// Category management is part of the OPS scope (Manage Machine/Products).
const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);

router.get(
  "/",
  CategoryController.getCategories
);

router.get(
  "/tree",
  CategoryController.getCategoryTree
);

router.get(
  "/:slug/machines",
  CategoryController.getMachinesByCategory
);

router.post(
  "/admin",
  opsGuard,
  uploadCategoryImage,
  CategoryController.createCategory
);

router.patch(
  "/admin/:id",
  opsGuard,
  CategoryController.updateCategory
);

router.delete(
  "/admin/:id",
  opsGuard,
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;
