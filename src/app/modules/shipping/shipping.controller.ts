import { Request, Response } from "express";
import { ShippingRateService } from "./shipping.service";

const upsertRate = async (req: Request, res: Response) => {
  const result = await ShippingRateService.upsertRate(req.body);

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getAllRates = async (_req: Request, res: Response) => {
  const result = await ShippingRateService.getAllRates();

  res.status(200).json({
    success: true,
    data: result,
  });
};

const toggleRate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const result = await ShippingRateService.toggleRate(id, isActive);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const ShippingRateController = {
  upsertRate,
  getAllRates,
  toggleRate,
};
