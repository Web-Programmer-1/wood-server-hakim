import express from "express";
import { AdminCouponController, applyCouponPreview, getAvailableCoupons, getCouponById } from "./coupon.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  AdminCouponController.createCoupon
);


// coupon.route.ts
router.get(
  "/usages",
  authGuard(UserRole.ADMIN),
  AdminCouponController.getCouponUsages
);


router.get(
  "/available",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
getAvailableCoupons
);


router.get(
  "/:couponId",
  authGuard(UserRole.ADMIN),
  getCouponById
);




router.get(
  "/",
  authGuard(UserRole.ADMIN),
  AdminCouponController.getCoupons
);

router.patch(
  "/:couponId",
  authGuard(UserRole.ADMIN),
  AdminCouponController.updateCoupon
);

router.patch(
  "/:couponId/status",
  authGuard(UserRole.ADMIN),
  AdminCouponController.toggleCouponStatus
);

router.delete(
  "/:couponId",
  authGuard(UserRole.ADMIN),
  AdminCouponController.deleteCoupon
);



// appy coupon using customar and admin

router.post(
  "/apply",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
  applyCouponPreview
);



router.get(
  "/analytics",
  authGuard(UserRole.ADMIN),
  AdminCouponController.getCouponAnalytics
)


export const AdminCouponRoutes = router;
