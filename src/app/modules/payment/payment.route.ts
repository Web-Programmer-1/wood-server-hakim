import express from "express";
import { PaymentController } from "./payment.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";


const router = express.Router();

// SSLCOMMERZ callbacks (no auth)
router.post("/ssl/success", PaymentController.sslSuccess);
router.post("/ssl/fail", PaymentController.sslFail);
router.post("/ssl/cancel", PaymentController.sslCancel);

router.post("/ssl/ipn", PaymentController.sslIpn);




// ----------------------------CUSTOMAR Dashboard Api------------------------------------------------------


router.get(
  "/my",
  authGuard(UserRole.CUSTOMER),
  PaymentController.getMyPayments
);



router.get(
  "/order/:orderId",
  authGuard(UserRole.CUSTOMER),
  PaymentController.getPaymentByOrder
);


router.post(
  "/retry/:orderId",
  authGuard(UserRole.CUSTOMER),
  PaymentController.retryPayment
);



















export const PaymentRoutes = router;
