import express, {  Request, Response } from "express";
import { uploadCategoryImages } from "../../../utils/multer";
import { categoryController } from "./category.controller";

const router = express.Router();



router.post("/", uploadCategoryImages, (req:Request, res:Response) => 
  categoryController.createCategory(req, res)
);

router.get("/", categoryController.getAllCategoriesController );


router.get("/:id", categoryController.getCategoryByIdCon);


router.put("/:id", uploadCategoryImages,
  categoryController.updateCategory
);

router.delete("/:id", categoryController.deleteCategoryCon);

router.post("/subcategory", uploadCategoryImages,
  categoryController.createSubCategoryCon
);


router.get("/subcategory/:id", categoryController.getSubCategoryByIdCon);


router.put("/subcategory/:id", uploadCategoryImages,
  categoryController.updateSubCategoryCon
);






export const categoryRoutes = router;
