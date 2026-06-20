import { Request, Response } from "express";
import httpStatus from "http-status";
import { TestimonialService } from "./testimoniral.service";

export const TestimonialController = {
create: async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    };

    const avatarUrl = files?.avatar?.[0]?.location;
    const cardBgImageUrl = files?.cardBg?.[0]?.location;
    const videoUrl = files?.video?.[0]?.location;

    const payload = {
      avatarUrl,
      cardBgImageUrl,
      description: req.body?.description,
      personName: req.body?.personName,
      companyName: req.body?.companyName,
      videoType: req.body?.videoType,
      youtubeUrl: req.body?.youtubeUrl,
      videoUrl,
      sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : 0,
    };

    const result = await TestimonialService.create(payload);

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Testimonial created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Failed to create testimonial",
    });
  }
},


   getAll: async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await TestimonialService.getAll({ page, limit });

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Testimonials retrieved successfully",
        meta: result.meta,
        data: result.data,
      });
    } catch (error: any) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error?.message || "Failed to retrieve testimonials",
      });
    }
  },


  getById: async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const result = await TestimonialService.getById(id);

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Testimonial retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: error?.message || "Testimonial not found",
    });
  }
},


update: async (req: Request, res: Response) => {
  try {

    const id = req.params.id as string;

    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    };

    const avatarUrl = files?.avatar?.[0]?.location;
    const cardBgImageUrl = files?.cardBg?.[0]?.location;
    const videoUrl = files?.video?.[0]?.location;

    const payload: any = {
      description: req.body?.description,
      personName: req.body?.personName,
      companyName: req.body?.companyName,

      videoType: req.body?.videoType,
      youtubeUrl: req.body?.youtubeUrl,

      sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : undefined,
    };

    if (avatarUrl) payload.avatarUrl = avatarUrl;

    // A new file wins; otherwise an explicit empty string clears the saved media.
    if (cardBgImageUrl) payload.cardBgImageUrl = cardBgImageUrl;
    else if (req.body?.cardBgImageUrl === "") payload.cardBgImageUrl = null;

    if (videoUrl) payload.videoUrl = videoUrl;
    else if (req.body?.videoUrl === "") payload.videoUrl = null;

    const result = await TestimonialService.update(id, payload);

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Testimonial updated successfully",
      data: result,
    });

  } catch (error: any) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Failed to update testimonial",
    });
  }
},


delete: async (req: Request, res: Response) => {
  try {

    const id = req.params.id as string;

    const result = await TestimonialService.delete(id);

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
      message: error?.message || "Failed to delete testimonial",
    });
  }
},










};