import { Request, Response } from "express";
import { trackPaperflyOrder } from "./courier.service";


export const paperflyTrackController = async (req: Request, res: Response) => {
  try {
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
      return res.status(400).json({
        success: false,
        message: "referenceNumber is required",
      });
    }

    const data = await trackPaperflyOrder(referenceNumber);

    return res.status(200).json({
      success: true,
      message: "Tracking fetched successfully",
      data,
    });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: err?.response?.data || err?.message || "Paperfly tracking failed",
    });
  }
};
