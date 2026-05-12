import express from "express";
import { CategoryController } from "./productCategory.controller";
import { uploadProductCategoryImage } from "../../middlewares/UploadProductCategoryImage";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);


router.post(
  "/",
  opsGuard,
  uploadProductCategoryImage.single("coverImage"),
  CategoryController.createCategory
);

router.patch(
  "/:id",
  opsGuard,
  uploadProductCategoryImage.single("coverImage"),
  CategoryController.updateCategory
);
router.delete("/:id", opsGuard, CategoryController.deleteCategory);
router.get("/", CategoryController.getAllCategories);

export const ProductCategoryRoutes = router;
