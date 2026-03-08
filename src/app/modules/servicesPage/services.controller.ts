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






    // ✅ GET ALL (allServices)
  getAll: async (_req: Request, res: Response) => {
    try {
      const result = await ServiceSectionService.getAll();
      return res.status(httpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to load service sections",
      });
    }
  },

  // ✅ GET SINGLE (getByServices)
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await ServiceSectionService.getById(id);

      return res.status(httpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: error?.message || "Service section not found",
      });
    }
  },




  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // banner optional
      const file = req.file as any;

      const payload: any = {
        heading: req.body?.heading,
        description: req.body?.description,

        primaryBtnText: req.body?.primaryBtnText,
        primaryBtnUrl: req.body?.primaryBtnUrl,
        secondaryBtnText: req.body?.secondaryBtnText,
        secondaryBtnUrl: req.body?.secondaryBtnUrl,
      };

      if (req.body?.sortOrder !== undefined) {
        payload.sortOrder = Number(req.body.sortOrder);
      }

      // if new banner uploaded -> replace bgImageUrl
      if (file?.location) {
        payload.bgImageUrl = file.location;
      }

      const result = await ServiceSectionService.update(id, payload);

      // slider friendly: return all (optional)
      const all = await ServiceSectionService.getAll();

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Service section updated successfully",
        data: all,
        updated: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to update service section",
      });
    }
  },









   delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await ServiceSectionService.delete(id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Service section deleted successfully",
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to delete service section",
      });
    }
  },







};