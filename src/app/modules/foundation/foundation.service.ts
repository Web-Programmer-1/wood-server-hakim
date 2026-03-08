import { Prisma } from "@prisma/client";
import { ICreateFoundationStoryPayload, IGetAllFoundationStoryQuery } from "./foundation.interface";
import { prisma } from "../../shared/prisma";

export const FoundationStoryService = {

  create: async (payload: ICreateFoundationStoryPayload) => {

    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error("Title is required");
    }

    if (!payload.slug || payload.slug.trim().length === 0) {
      throw new Error("Slug is required");
    }

    if (!payload.cardImageUrl) {
      throw new Error("Card image is required");
    }

    const vt = payload.videoType?.trim();

    if (vt && vt !== "YOUTUBE" && vt !== "UPLOAD") {
      throw new Error('videoType must be "YOUTUBE" or "UPLOAD"');
    }

    if (vt === "YOUTUBE" && (!payload.youtubeUrl || payload.youtubeUrl.trim().length === 0)) {
      throw new Error("youtubeUrl is required when videoType is YOUTUBE");
    }

    if (vt === "UPLOAD" && (!payload.videoUrl || payload.videoUrl.trim().length === 0)) {
      throw new Error("video file is required when videoType is UPLOAD");
    }

    const data: Prisma.FoundationStoryCreateInput = {
      title: payload.title.trim(),
      slug: payload.slug.trim(),
      description: payload.description?.trim() ?? null,

      cardImageUrl: payload.cardImageUrl,

      videoType: payload.videoType ?? null,
      youtubeUrl: payload.youtubeUrl ?? null,
      videoUrl: payload.videoUrl ?? null,

      galleryImages: payload.galleryImages ?? [],

      sortOrder: payload.sortOrder ?? 0
    };

    return prisma.foundationStory.create({ data });
  },





   getAll: async (query: IGetAllFoundationStoryQuery) => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.FoundationStoryWhereInput = search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.foundationStory.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          cardImageUrl: true,
        },
      }),
      prisma.foundationStory.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data,
    };
  },

  getById: async (id: string) => {
    let result = await prisma.foundationStory.findUnique({
      where: { id },
    });

    if (!result) {
      result = await prisma.foundationStory.findUnique({
        where: { slug: id },
      });
    }

    if (!result) {
      throw new Error("Foundation story not found");
    }

    return result;
  },


  update: async (id: string, payload: any) => {

  const isExist = await prisma.foundationStory.findUnique({
    where: { id }
  });

  if (!isExist) {
    throw new Error("Foundation story not found");
  }

  const vt = payload.videoType?.trim();

  if (vt && vt !== "YOUTUBE" && vt !== "UPLOAD") {
    throw new Error('videoType must be "YOUTUBE" or "UPLOAD"');
  }

  if (
    vt === "YOUTUBE" &&
    (!payload.youtubeUrl || payload.youtubeUrl.trim().length === 0)
  ) {
    throw new Error("youtubeUrl is required when videoType is YOUTUBE");
  }

  if (
    vt === "UPLOAD" &&
    (!payload.videoUrl || payload.videoUrl.trim().length === 0)
  ) {
    throw new Error("video file is required when videoType is UPLOAD");
  }

  const data: any = {};

  if (payload.title !== undefined) {
    if (payload.title.trim().length === 0) {
      throw new Error("Title cannot be empty");
    }
    data.title = payload.title.trim();
  }

  if (payload.slug !== undefined) {
    if (payload.slug.trim().length === 0) {
      throw new Error("Slug cannot be empty");
    }
    data.slug = payload.slug.trim();
  }

  if (payload.description !== undefined) {
    data.description = payload.description?.trim() ?? null;
  }

  if (payload.cardImageUrl !== undefined) {
    data.cardImageUrl = payload.cardImageUrl;
  }

  if (payload.videoType !== undefined) {
    data.videoType = payload.videoType;
  }

  if (payload.youtubeUrl !== undefined) {
    data.youtubeUrl = payload.youtubeUrl?.trim() ?? null;
  }

  if (payload.videoUrl !== undefined) {
    data.videoUrl = payload.videoUrl ?? null;
  }

  if (payload.galleryImages !== undefined) {
    data.galleryImages = payload.galleryImages;
  }

  if (payload.sortOrder !== undefined) {
    data.sortOrder = payload.sortOrder;
  }

  const result = await prisma.foundationStory.update({
    where: { id },
    data
  });

  return result;
},



delete: async (id: string) => {

  const isExist = await prisma.foundationStory.findUnique({
    where: { id }
  });

  if (!isExist) {
    throw new Error("Foundation story not found");
  }

  await prisma.foundationStory.delete({
    where: { id }
  });

  const count = await prisma.foundationStory.count();

  return {
    message: "Foundation story deleted successfully",
    remainingCount: count
  };
},




};