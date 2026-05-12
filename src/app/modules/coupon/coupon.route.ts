import express from "express";
import { AdminCouponController, applyCouponPreview, getAvailableCoupons, getCouponByIdController } from "./coupon.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();




router.post(
  "/",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.createCoupon
);


// coupon.route.ts
router.get(
  "/usages",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.getCouponUsages
);


router.get(
  "/available",
  authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER, UserRole.MANAGER),
getAvailableCoupons
);






router.get(
  "/",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.getCoupons
);





router.patch(
  "/:couponId",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.updateCoupon
);

router.patch(
  "/:couponId/status",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.toggleCouponStatus
);

router.delete(
  "/:couponId",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.deleteCoupon
);



// appy coupon using customar and admin

router.post(
  "/apply",
  authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER, UserRole.MANAGER),
  applyCouponPreview
);



router.get(
  "/analytics",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminCouponController.getCouponAnalytics
)



router.get(
  "/:couponId",
  // authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  getCouponByIdController
);


export const AdminCouponRoutes = router;





















