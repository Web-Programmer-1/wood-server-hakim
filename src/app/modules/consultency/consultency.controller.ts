import { Request, Response } from "express";
import httpStatus from "http-status";
import { ConsultencyBannerService } from "./consultency.service";

export const ConsultencyBannerController = {
  create: async (req: Request, res: Response) => {
    try {
      const file = req.file as any;

      if (!file?.location) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "banner image is required",
        });
      }

      const payload = {
        subHeading: req.body?.subHeading,
        heading: req.body?.heading,
        buttonText: req.body?.buttonText,
        buttonUrl: req.body?.buttonUrl,
        tagOne: req.body?.tagOne,
        tagTwo: req.body?.tagTwo,
        tagThree: req.body?.tagThree,
        bgImageUrl: file.location,
        sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : 0,
      };

      const result = await ConsultencyBannerService.create(payload);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Consultency banner created successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to create consultency banner",
      });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await ConsultencyBannerService.getAll({ page, limit });

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Consultency banners retrieved successfully",
        meta: result.meta,
        data: result.data,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to retrieve consultency banners",
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await ConsultencyBannerService.getById(id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Consultency banner retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: error?.message || "Consultency banner not found",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const file = req.file as any;

      const payload: any = {
        subHeading: req.body?.subHeading,
        heading: req.body?.heading,
        buttonText: req.body?.buttonText,
        buttonUrl: req.body?.buttonUrl,
        tagOne: req.body?.tagOne,
        tagTwo: req.body?.tagTwo,
        tagThree: req.body?.tagThree,
      };

      if (req.body?.sortOrder !== undefined) {
        payload.sortOrder = Number(req.body.sortOrder);
      }

      if (file?.location) {
        payload.bgImageUrl = file.location;
      }

      const result = await ConsultencyBannerService.update(id, payload);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Consultency banner updated successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to update consultency banner",
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await ConsultencyBannerService.delete(id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: result.message,
        data: {
          remaining: result.remainingCount,
        },
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to delete consultency banner",
      });
    }
  },
};