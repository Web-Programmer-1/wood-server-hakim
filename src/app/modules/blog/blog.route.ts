import { Router } from "express";
import { createBlogController, deleteBlogController, getBlogBySlugController, getBlogsAdminController, updateBlogController } from "./blog.controller";


import { uploadContentImage } from "../../middlewares/upload.blog.image";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";

const router = Router();

// Blogs belong to the CONTENT scope: SUPER_ADMIN / ADMIN / SOCIAL_MANAGER.
const contentGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SOCIAL_MANAGER
);

router.post(
  "/",
  contentGuard,
  uploadContentImage.single("coverImage"),
  createBlogController
);



router.get("/", getBlogsAdminController);

router.get("/:slug", getBlogBySlugController);

router.patch(
  "/:id",
  contentGuard,
  uploadContentImage.single("coverImage"),
  updateBlogController
);



router.delete(
  "/:id",
  contentGuard,
  deleteBlogController
);



export const BlogRoutes = router;
