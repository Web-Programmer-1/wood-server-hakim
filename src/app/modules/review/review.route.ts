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
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SOCIAL_MANAGER,
    UserRole.CUSTOMER
  ),
  createReviewHandler
);



//  review Control for Admin -------------------------------------------------




router.get(
  "/admin/reviews",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER
  ),
  getAllReviewsAdminHandler
);

router.delete(
  "/admin/reviews/:reviewId",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER
  ),
  deleteReviewAdminHandler
);


export const ReviewRoutes = router;
