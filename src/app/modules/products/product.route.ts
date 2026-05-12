import express from "express";
import { ProductController } from "./product.controller";
import { uploadProductImages } from "../../middlewares/uploadProductImage";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();


// Product management is part of the OPS scope: SUPER_ADMIN / ADMIN / MANAGER.
const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);


router.post(
  "/",
  opsGuard,
  uploadProductImages.fields([
    { name: "images", maxCount: 10 },
    { name: "variantImages", maxCount: 20 },
  ]),
  ProductController.createProduct
);


router.get("/", ProductController.getAllProducts);


router.get("/brands", ProductController.getAllProductBrands);
router.get("/:slug", ProductController.getProductDetails);
router.get("/:slug/related", ProductController.getRelatedProducts);


router.patch(
  "/:id",
  opsGuard,
  uploadProductImages.fields([
    { name: "images", maxCount: 6 },
    { name: "variantImages", maxCount: 20 },
  ]),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  opsGuard,
  ProductController.deleteProduct
);




export const ProductRoutes = router;
