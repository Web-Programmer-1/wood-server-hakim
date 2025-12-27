import express from "express";
import { ProductController } from "./product.controller";
import { uploadProductImages } from "../../middlewares/uploadProductImage";


const router = express.Router();

// ADMIN
router.post(
  "/",
  uploadProductImages.array("images", 6),
  ProductController.createProduct
);

router.get("/", ProductController.getAllProducts);



router.get("/:slug", ProductController.getProductDetails);
router.get("/:slug/related", ProductController.getRelatedProducts);



// ADMIN
router.patch(
  "/:id",
  uploadProductImages.array("images", 6), // optional
  ProductController.updateProduct
);

router.delete(
  "/:id",
  ProductController.deleteProduct
);




export const ProductRoutes = router;
