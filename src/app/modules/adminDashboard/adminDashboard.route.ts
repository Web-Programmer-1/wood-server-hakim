import express from "express";
import { authGuard } from "../../middlewares/auth";

import { getAdminDashboardOverviewController } from "./adminDashboard.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();
// admin overview
router.get(
  "/overview",
  authGuard(UserRole.ADMIN),
  getAdminDashboardOverviewController
);

export const AdminDashboardRoutes = router;

