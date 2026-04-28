import { Request, Response } from "express";
import { FoundationStoryService } from "./foundation.service";


export  const FoundationStoryController = {

    create: async (req: Request, res: Response) => {
  try {

    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    };

    const cardImage = files?.cardImage?.[0]?.location;
    const videoFile = files?.video?.[0]?.location;

    const gallery = files?.galleryImages?.map((img) => ({
      imageUrl: img.location
    })) || [];

    const payload: any = {
      title: req.body?.title,
      slug: req.body?.slug,
      description: req.body?.description,

      videoType: req.body?.videoType,
      youtubeUrl: req.body?.youtubeUrl,

      cardImageUrl: cardImage,
      videoUrl: videoFile,

      galleryImages: gallery,

      sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : 0
    };

    const result = await FoundationStoryService.create(payload);

    return res.status(201).json({
      success: true,
      message: "Foundation story created successfully",
      data: result
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to create foundation story"
    });
  }
},





getAll: async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await FoundationStoryService.getAll({
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Foundation stories retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to retrieve stories",
    });
  }
},


getById: async (req: Request, res: Response) => {
  try {

    const id = req.params.id as string;

    const result = await FoundationStoryService.getById(id);

    return res.status(200).json({
      success: true,
      message: "Foundation story retrieved successfully",
      data: result
    });

  } catch (error: any) {

    return res.status(404).json({
      success: false,
      message: error?.message || "Story not found"
    });

  }
},

update: async (req: Request, res: Response) => {
  try {

    const id = req.params.id as string;

    const files = req.files as {
      [fieldname: string]: Express.MulterS3.File[];
    };

    const cardImage = files?.cardImage?.[0]?.location;
    const videoFile = files?.video?.[0]?.location;

    const gallery =
      files?.galleryImages?.map((img) => ({
        imageUrl: img.location
      })) || undefined;

    const payload: any = {
      title: req.body?.title,
      slug: req.body?.slug,
      description: req.body?.description,

      videoType: req.body?.videoType,
      youtubeUrl: req.body?.youtubeUrl,

      sortOrder: req.body?.sortOrder
        ? Number(req.body.sortOrder)
        : undefined
    };

    if (cardImage) payload.cardImageUrl = cardImage;
    if (videoFile) payload.videoUrl = videoFile;
    if (gallery) payload.galleryImages = gallery;

    const result = await FoundationStoryService.update(id, payload);

    return res.status(200).json({
      success: true,
      message: "Foundation story updated successfully",
      data: result
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to update story"
    });

  }
},



delete: async (req: Request, res: Response) => {
  try {

    const id = req.params.id as string;

    const result = await FoundationStoryService.delete(id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        remaining: result.remainingCount
      }
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to delete story"
    });

  }
},







}