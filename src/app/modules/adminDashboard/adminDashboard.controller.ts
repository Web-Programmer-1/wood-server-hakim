import { Request, Response } from "express";
import { AdminDashboardService } from "./adminDashboard.service";

export const getAdminDashboardOverviewController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await AdminDashboardService.getOverview();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to load admin dashboard overview",
    });
  }
};

