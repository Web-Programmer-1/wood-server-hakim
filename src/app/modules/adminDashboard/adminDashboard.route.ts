import express from "express";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";
import { getAdminDashboardOverviewController } from "./adminDashboard.controller";

const router = express.Router();

router.get(
  "/overview",
  authGuard(UserRole.ADMIN),
  getAdminDashboardOverviewController
);

export const AdminDashboardRoutes = router;

