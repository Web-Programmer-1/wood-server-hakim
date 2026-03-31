import express from "express";
import { ProductController } from "./product.controller";
import { uploadProductImages } from "../../middlewares/uploadProductImage";


const router = express.Router();




router.post(
  "/",
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
  uploadProductImages.fields([
    { name: "images", maxCount: 6 },
    { name: "variantImages", maxCount: 20 },
  ]),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  ProductController.deleteProduct
);




export const ProductRoutes = router;
