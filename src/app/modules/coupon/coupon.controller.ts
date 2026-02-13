
import { Request, Response } from "express";
import { AdminCouponService, CouponPreviewService, getCouponAnalyticsStats, getCouponById, getCouponUsagesForAdmin } from "./coupon.service";

const createCoupon = async (req: Request, res: Response) => {
  const result = await AdminCouponService.create(req.body);
  res.status(201).json({ success: true, data: result });
};

const getCoupons = async (req: Request, res: Response) => {
  const result = await AdminCouponService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
};

const updateCoupon = async (req: Request, res: Response) => {
  const { couponId } = req.params;
  const result = await AdminCouponService.update(couponId, req.body);
  res.status(200).json({ success: true, data: result });
};

const toggleCouponStatus = async (req: Request, res: Response) => {
  const { couponId } = req.params;
  const { isActive } = req.body;
  const result = await AdminCouponService.toggleStatus(couponId, isActive);
  res.status(200).json({ success: true, data: result });
};

const deleteCoupon = async (req: Request, res: Response) => {
  const { couponId } = req.params;
  await AdminCouponService.remove(couponId);
  res.status(200).json({ success: true, message: "Coupon deleted" });
};




export const applyCouponPreview = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { couponCode } = req.body;

  const result = await CouponPreviewService.apply(userId, couponCode);

  res.status(200).json({
    success: true,
    message: "Coupon applied",
    data: result,
  });
};





 export const getAvailableCoupons = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const data = await AdminCouponService.getAvailableCoupons(userId);

  res.status(200).json({
    success: true,
    data,
  });
};


// coupon.controller.ts
const getCouponUsages = async (req: Request, res: Response) => {
  const data = await getCouponUsagesForAdmin(req.query);

  res.status(200).json({
    success: true,
    data,
  });
};





const getCouponAnalytics = async (req: Request, res: Response) => {
  const data = await getCouponAnalyticsStats();

  res.status(200).json({
    success: true,
    data,
  });
};




export const getCouponByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { couponId } = req.params;

    const result =
      await getCouponById(couponId);

    res.status(200).json({
      success: true,
      message: "Coupon fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};





export const AdminCouponController = {
  createCoupon,
  getCoupons,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponUsages,
  getCouponAnalytics,
};
