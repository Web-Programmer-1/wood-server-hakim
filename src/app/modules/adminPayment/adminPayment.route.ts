import express from "express";
import { authGuard } from "../../middlewares/auth";

import { AdminPaymentController } from "./adminPayment.controller";
import { UserRole } from "../../constants/UserRole";

const router = express.Router();



router.get(
  "/payments/summary",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  AdminPaymentController.getPaymentsSummary
);



router.get(
  "/payments",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  AdminPaymentController.getPayments
);




router.get(
  "/payments/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  AdminPaymentController.getPaymentDetailsAdmin
);



router.get(
  "/payments/audit/:id",
  authGuard(UserRole.ADMIN,UserRole.CUSTOMER),
  AdminPaymentController.getPaymentAudit
);



router.get(
  "/payments/orders/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  AdminPaymentController.getOrderPaymentsAdmin
);




router.patch(
  "/payments/mark-failed/:id",
  authGuard(UserRole.ADMIN,UserRole.CUSTOMER),
  AdminPaymentController.markPaymentFailed
);





router.patch(
  "/payments/mark-paid/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  AdminPaymentController.markPaymentPaid
);







 export const adminPaymentRoutes = router;