import express from "express";
import { OrderController } from "./order.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();


// only for admin 

router.get("/admin",OrderController.getAllOrdersAdmin);

router.get("/admin/:orderId",    OrderController.getOrderDetailsAdmin);


// ADMIN
router.patch(
  "/admin/:orderId/status",
  OrderController.updateOrderStatus
);


// ---------------------------------




router.get("/my", authGuard(UserRole.CUSTOMER), OrderController.getMyOrders);


router.post("/checkout", authGuard(UserRole.CUSTOMER) , OrderController.checkout);


router.get("/:orderId", authGuard(UserRole.CUSTOMER), OrderController.getOrderDetails);


router.patch("/:orderId/cancel",authGuard(UserRole.CUSTOMER), OrderController.cancelOrder);





// -------------------------- ONLY for ADMIN ----------------------------


router.get("/admin",authGuard(UserRole.CUSTOMER), OrderController.getAllOrdersAdmin);







export const OrderRoutes = router;
