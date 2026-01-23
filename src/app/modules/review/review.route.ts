import { Router } from "express";
import { createReviewHandler, deleteReviewAdminHandler, getAllReviewsAdminHandler, getProductReviewsHandler } from "./review.controller";

import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";

const router = Router();



router.get(
  "/products/:productId/reviews",
  getProductReviewsHandler
);


router.post(
  "/",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  createReviewHandler
);



//  review  Contoll for Admin -------------------------------------------------




router.get(
  "/admin/reviews",
  authGuard(UserRole.CUSTOMER,UserRole.ADMIN),
  getAllReviewsAdminHandler
);

router.delete(
  "/admin/reviews/:reviewId",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
  deleteReviewAdminHandler
);


export const ReviewRoutes = router;
