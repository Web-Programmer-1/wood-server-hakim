import express from "express";
import { OrderController } from "./order.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

// Order management is part of the OPS scope: SUPER_ADMIN / ADMIN / MANAGER.
const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);

// SOCIAL_MANAGER also has customer-like access to /my and checkout because
// the spec says SOCIAL_MANAGER "also has CUSTOMER access".
const customerLikeGuard = authGuard(
  UserRole.CUSTOMER,
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SOCIAL_MANAGER
);


// only for admin / ops

router.get("/admin",
  opsGuard,
  OrderController.getAllOrdersAdmin);

router.get("/admin/:orderId",
  opsGuard,
  OrderController.getOrderDetailsAdmin);


// ADMIN / OPS
router.patch(
  "/admin/:orderId/status",
  opsGuard,
  OrderController.updateOrderStatus
);


// ---------------------------------



router.get("/top-selling-products", OrderController.getTopSellingProducts);


router.get("/my", customerLikeGuard, OrderController.getMyOrders);

router.get(
  "/my/:orderId/tracking",
  customerLikeGuard,
  OrderController.getMyOrderTracking
);


router.post("/checkout", customerLikeGuard, OrderController.checkout);


router.get("/:orderId", customerLikeGuard, OrderController.getOrderDetails);


router.patch("/:orderId/cancel", customerLikeGuard, OrderController.cancelOrder);



//  Paperfly Order Tracking  Api


router.get(
  "/:orderId/tracking",
  customerLikeGuard,
  OrderController.trackOrder
);


router.delete(
  "/admin/:id",
  opsGuard,
  OrderController.deleteOrder
);




export const OrderRoutes = router;
