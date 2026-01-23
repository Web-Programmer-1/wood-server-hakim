import { Router } from "express";
import { createBlogController, deleteBlogController, getBlogBySlugController, getBlogsAdminController, updateBlogController } from "./blog.controller";


import { uploadContentImage } from "../../middlewares/upload.blog.image";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";

const router = Router();

router.post(
  "/",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
  uploadContentImage.single("coverImage"),
  createBlogController
);



router.get("/", getBlogsAdminController);

router.get("/:slug", getBlogBySlugController);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  uploadContentImage.single("coverImage"),
  updateBlogController
);
  


router.delete(
  "/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  deleteBlogController
);  



export const BlogRoutes = router;
