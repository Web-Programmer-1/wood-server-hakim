import express from "express";
import { OrderController } from "./order.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();


// only for admin 

router.get("/admin",
  authGuard(UserRole.ADMIN),
  OrderController.getAllOrdersAdmin);

router.get("/admin/:orderId",    OrderController.getOrderDetailsAdmin);


// ADMIN
router.patch(
  "/admin/:orderId/status",
  OrderController.updateOrderStatus
);


// ---------------------------------



router.get("/top-selling-products", OrderController.getTopSellingProducts);


router.get("/my", authGuard(UserRole.CUSTOMER, UserRole.ADMIN), OrderController.getMyOrders);

router.get(
  "/my/:orderId/tracking",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
  OrderController.getMyOrderTracking
);


router.post("/checkout", authGuard(UserRole.CUSTOMER, UserRole.ADMIN) , OrderController.checkout);


router.get("/:orderId", authGuard(UserRole.CUSTOMER), OrderController.getOrderDetails);


router.patch("/:orderId/cancel",authGuard(UserRole.CUSTOMER), OrderController.cancelOrder);



//  Paperfly Order Tracking  Api


router.get(
  "/:orderId/tracking",
  authGuard(UserRole.CUSTOMER, UserRole.ADMIN),
  OrderController.trackOrder
);





// -------------------------- ONLY for ADMIN ----------------------------


router.get("/admin",authGuard(UserRole.CUSTOMER), OrderController.getAllOrdersAdmin);



router.delete(
  "/admin/:id",
  authGuard(UserRole.ADMIN),
  OrderController.deleteOrder
);




export const OrderRoutes = router;
