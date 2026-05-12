import express from "express";
import { authGuard } from "../../middlewares/auth";

import { AdminPaymentController } from "./adminPayment.controller";
import { UserRole } from "../../constants/UserRole";

const router = express.Router();



router.get(
  "/payments/summary",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.getPaymentsSummary
);



router.get(
  "/payments",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.getPayments
);




router.get(
  "/payments/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.getPaymentDetailsAdmin
);



router.get(
  "/payments/audit/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.getPaymentAudit
);



router.get(
  "/payments/orders/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.getOrderPaymentsAdmin
);




router.patch(
  "/payments/mark-failed/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.markPaymentFailed
);





router.patch(
  "/payments/mark-paid/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  AdminPaymentController.markPaymentPaid
);







 export const adminPaymentRoutes = router;