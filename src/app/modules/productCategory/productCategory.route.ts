import express from "express";
import { CategoryController } from "./productCategory.controller";
import { uploadProductCategoryImage } from "../../middlewares/UploadProductCategoryImage";


const router = express.Router();


router.post(
  "/",
  uploadProductCategoryImage.single("coverImage"), // 🔥
  CategoryController.createCategory
);

router.patch(
  "/:id",
  uploadProductCategoryImage.single("coverImage"),
  CategoryController.updateCategory
);
router.delete("/:id", CategoryController.deleteCategory);
router.get("/", CategoryController.getAllCategories);

export const ProductCategoryRoutes = router;