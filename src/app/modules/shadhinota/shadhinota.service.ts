import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import {
  ICreateShadhinotaPayload,
  IGetAllShadhinotaQuery,
  IUpdateShadhinotaPayload,
} from "./shadhinota.interface";

type PrismaClientWithShadhinota = PrismaClient & {
  shadhinota: any;
  shadhinotaImage: any;
  shadhinotaVideo: any;
  shadhinotaUploadVideo: any;
};

const prismaClient = prisma as unknown as PrismaClientWithShadhinota;

const normalizeSubtitles = (subtitles: string[] | undefined) => {
  if (!subtitles) return [];
  const cleaned = subtitles
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0);
  return cleaned.length > 0 ? cleaned : [];
};

export const ShadhinotaService = {
  create: async (payload: ICreateShadhinotaPayload) => {
    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error("Title is required");
    }

    if (!Array.isArray(payload.imageUrls) || payload.imageUrls.length === 0) {
      throw new Error("At least 1 image is required");
    }

    if (payload.sortOrder !== undefined && payload.sortOrder < 0) {
      throw new Error("sortOrder must be a positive number");
    }

    const title = payload.title.trim();
    const subtitles = normalizeSubtitles(payload.subtitles);

    const data = {
      title,
      subtitles: subtitles.length > 0 ? subtitles : [],
      sortOrder: payload.sortOrder ?? 0,
      images: {
        create: payload.imageUrls.map((url, index) => ({
          url,
          sortOrder: index,
        })),
      },
    };

    return prismaClient.shadhinota.create({
      data,
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        video: true,
      },
    });
  },

  getAll: async (query: IGetAllShadhinotaQuery) => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where = search
      ? {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const [data, total] = await Promise.all([
      prismaClient.shadhinota.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          video: true,
        },
      }),
      prismaClient.shadhinota.count({ where }),
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
    const result = await prismaClient.shadhinota.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        video: true,
      },
    });

    if (!result) {
      throw new Error("Shadhinota not found");
    }

    return result;
  },

  update: async (id: string, payload: IUpdateShadhinotaPayload) => {
    await ShadhinotaService.getById(id);

    if (payload.sortOrder !== undefined && payload.sortOrder < 0) {
      throw new Error("sortOrder must be a positive number");
    }

    const data: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      if (payload.title.trim().length === 0) throw new Error("Title cannot be empty");
      data.title = payload.title.trim();
    }

    if (payload.subtitles !== undefined) {
      data.subtitles = normalizeSubtitles(payload.subtitles);
    }

    if (payload.sortOrder !== undefined) {
      data.sortOrder = payload.sortOrder;
    }

    return prismaClient.shadhinota.update({
      where: { id },
      data,
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        video: true,
      },
    });
  },

  addImages: async (id: string, imageUrls: string[]) => {
    await ShadhinotaService.getById(id);

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error("At least 1 image is required");
    }

    const existingCount = await prismaClient.shadhinotaImage.count({
      where: { shadhinotaId: id },
    });

    await prismaClient.shadhinotaImage.createMany({
      data: imageUrls.map((url, index) => ({
        shadhinotaId: id,
        url,
        sortOrder: existingCount + index,
      })),
    });

    return ShadhinotaService.getById(id);
  },

  deleteImage: async (imageId: string) => {
    const isExist = await prismaClient.shadhinotaImage.findUnique({
      where: { id: imageId },
    });

    if (!isExist) {
      throw new Error("Image not found");
    }

    await prismaClient.shadhinotaImage.delete({
      where: { id: imageId },
    });

    return { message: "Image deleted successfully" };
  },

  upsertVideo: async (id: string, videoUrl: string) => {
    await ShadhinotaService.getById(id);

    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new Error("Video is required");
    }

    await prismaClient.shadhinotaVideo.upsert({
      where: { shadhinotaId: id },
      create: { shadhinotaId: id, url: videoUrl },
      update: { url: videoUrl },
    });

    return ShadhinotaService.getById(id);
  },

  deleteVideo: async (id: string) => {
    await ShadhinotaService.getById(id);

    await prismaClient.shadhinotaVideo.deleteMany({
      where: { shadhinotaId: id },
    });

    return { message: "Video deleted successfully" };
  },

  upsertGlobalVideo: async (videoUrl: string) => {
    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new Error("Video is required");
    }

    return prismaClient.shadhinotaUploadVideo.upsert({
      where: { key: "MAIN" },
      create: { key: "MAIN", url: videoUrl },
      update: { url: videoUrl },
    });
  },

  deleteGlobalVideo: async () => {
    await prismaClient.shadhinotaUploadVideo.deleteMany({
      where: { key: "MAIN" },
    });

    return { message: "Video deleted successfully" };
  },

  delete: async (id: string) => {
    await ShadhinotaService.getById(id);

    await prismaClient.shadhinota.delete({
      where: { id },
    });

    const count = await prismaClient.shadhinota.count();

    return {
      message: "Shadhinota deleted successfully",
      remainingCount: count,
    };
  },
};
