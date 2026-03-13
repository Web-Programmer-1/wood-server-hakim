import { Request, Response } from "express";
import httpStatus from "http-status";
import { ShadhinotaService } from "./shadhinota.service";

const parseSubtitles = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;

  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
      return [String(parsed)];
    }
    if (trimmed.includes(",")) {
      return trimmed.split(",").map((s) => s.trim());
    }
    return [trimmed];
  }

  return [String(value)];
};

export const ShadhinotaController = {
  create: async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.MulterS3.File[] | undefined;
      const imageUrls = (files ?? []).map((f) => f.location).filter(Boolean);

      const payload = {
        title: req.body?.title,
        subtitles: parseSubtitles(req.body?.subtitles),
        sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : 0,
        imageUrls,
      };

      const result = await ShadhinotaService.create(payload);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Shadhinota created successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to create shadhinota",
      });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await ShadhinotaService.getAll({
        search,
        page,
        limit,
      });

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Shadhinota retrieved successfully",
        meta: result.meta,
        data: result.data,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to load shadhinota",
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await ShadhinotaService.getById(id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Shadhinota retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: error?.message || "Shadhinota not found",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const payload = {
        title: req.body?.title,
        subtitles: req.body?.subtitles !== undefined ? parseSubtitles(req.body?.subtitles) : undefined,
        sortOrder: req.body?.sortOrder !== undefined ? Number(req.body.sortOrder) : undefined,
      };

      const result = await ShadhinotaService.update(id, payload);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Shadhinota updated successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to update shadhinota",
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await ShadhinotaService.delete(id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: result.message,
        data: { remaining: result.remainingCount },
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to delete shadhinota",
      });
    }
  },

  addImages: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = req.files as Express.MulterS3.File[] | undefined;
      const imageUrls = (files ?? []).map((f) => f.location).filter(Boolean);

      const result = await ShadhinotaService.addImages(id, imageUrls);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Images uploaded successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to upload images",
      });
    }
  },

  deleteImage: async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;
      const result = await ShadhinotaService.deleteImage(imageId);

      return res.status(httpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to delete image",
      });
    }
  },

  uploadVideo: async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.MulterS3.File | undefined;

      if (!file?.location) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "video is required",
        });
      }

      const result = await ShadhinotaService.upsertGlobalVideo(file.location);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Video uploaded successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to upload video",
      });
    }
  },

  deleteVideo: async (_req: Request, res: Response) => {
    try {
      const result = await ShadhinotaService.deleteGlobalVideo();

      return res.status(httpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to delete video",
      });
    }
  },
};
