import { Request, Response } from "express";
import httpStatus from "http-status";
import { ServiceSectionService } from "./services.service";

export const ServiceSectionController = {
  create: async (req: Request, res: Response) => {
    try {
      // multer-s3 file
      const file = req.file as any;

      // minimal controller validation (file must exist)
      if (!file?.location) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "banner image is required",
        });
      }

      const payload = {
        heading: req.body?.heading,
        description: req.body?.description,

        primaryBtnText: req.body?.primaryBtnText,
        primaryBtnUrl: req.body?.primaryBtnUrl,
        secondaryBtnText: req.body?.secondaryBtnText,
        secondaryBtnUrl: req.body?.secondaryBtnUrl,

        bgImageUrl: file.location, // ✅ S3 URL
        sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : 0,
      };

      const result = await ServiceSectionService.create(payload);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Service section created successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to create service section",
      });
    }
  },
};