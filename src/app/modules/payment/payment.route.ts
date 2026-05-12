import express from "express";
import { PaymentController } from "./payment.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";


const router = express.Router();

// SSLCOMMERZ callbacks (no auth)
router.post("/ssl/success", PaymentController.sslSuccess);
router.post("/ssl/fail", PaymentController.sslFail);
router.post("/ssl/cancel", PaymentController.sslCancel);
// Public receipt for payment pages (no auth)
router.get("/ssl/receipt/:tranId", PaymentController.getSslReceipt);
router.post("/ssl/ipn", PaymentController.sslIpn);





// ----------------------------CUSTOMAR Dashboard Api------------------------------------------------------


router.get(
  "/my",
  authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  PaymentController.getMyPayments
);



router.get(
  "/order/:orderId",
  authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  PaymentController.getPaymentByOrder
);


router.post(
  "/retry/:orderId",
  authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  PaymentController.retryPayment
);



router.patch(
  "/:paymentId/status",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  PaymentController.updatePaymentStatus
);















export const PaymentRoutes = router;
