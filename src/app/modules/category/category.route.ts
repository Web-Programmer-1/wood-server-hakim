

import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

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
  // authGuard(UserRole.ADMIN),
  CategoryController.createCategory
);

router.patch(
  "/admin/:id",
  // authGuard(UserRole.ADMIN),
  CategoryController.updateCategory
);

router.delete(
  "/admin/:id",
  // authGuard(UserRole.ADMIN),
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;
