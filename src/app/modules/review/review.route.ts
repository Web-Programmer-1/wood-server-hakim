import { Router } from "express";
import { createReviewHandler, deleteReviewAdminHandler, getAllReviewsAdminHandler, getProductReviewsHandler } from "./review.controller";

import { UserRole } from "@prisma/client";
import { authGuard } from "../../middlewares/auth";

const router = Router();



router.get(
  "/products/:productId/reviews",
  getProductReviewsHandler
);


router.post(
  "/",
  authGuard(UserRole.CUSTOMER),
  createReviewHandler
);



//  review  Contoll for Admin -------------------------------------------------




router.get(
  "/admin/reviews",
  authGuard(UserRole.CUSTOMER),
  getAllReviewsAdminHandler
);

router.delete(
  "/admin/reviews/:reviewId",
  authGuard(UserRole.CUSTOMER),
  deleteReviewAdminHandler
);


export const ReviewRoutes = router;
