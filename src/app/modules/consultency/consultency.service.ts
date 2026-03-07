import { Prisma } from "@prisma/client";
import { ICreateConsultencyBannerPayload, IGetAllConsultencyBannerQuery, IUpdateConsultencyBannerPayload } from "./consultency.interface";
import { prisma } from "../../shared/prisma";

export const ConsultencyBannerService = {
  create: async (payload: ICreateConsultencyBannerPayload) => {


    if(!payload.heading || payload.heading.length ===0){
      throw new Error("Heading is required");
    };

    if (!payload.bgImageUrl || payload.bgImageUrl.trim().length === 0) {
      throw new Error("Background image is required");
    };

    if (payload.sortOrder !== undefined && payload.sortOrder < 0) {
      throw new Error("sortOrder must be a positive number");
    };

    const data: Prisma.ConsultencyBannerCreateInput = {
      subHeading: payload.subHeading?.trim() ?? null,
      heading: payload.heading.trim(),
      buttonText: payload.buttonText?.trim() ?? null,
      buttonUrl: payload.buttonUrl?.trim() ?? null,
      tagOne: payload.tagOne?.trim() ?? null,
      tagTwo: payload.tagTwo?.trim() ?? null,
      tagThree: payload.tagThree?.trim() ?? null,
      bgImageUrl: payload.bgImageUrl.trim(),
      sortOrder: payload.sortOrder ?? 0,
    };

    return prisma.consultencyBanner.create({ data });
  },

  getAll: async (query: IGetAllConsultencyBannerQuery) => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.consultencyBanner.findMany({
        skip,
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.consultencyBanner.count(),
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
    const result = await prisma.consultencyBanner.findUnique({
      where: { id },
    });

    if (!result) {
      throw new Error("Consultency banner not found");
    }

    return result;
  },

  update: async (id: string, payload: IUpdateConsultencyBannerPayload) => {
    const isExist = await prisma.consultencyBanner.findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new Error("Consultency banner not found");
    }

    if (payload.sortOrder !== undefined && payload.sortOrder < 0) {
      throw new Error("sortOrder must be a positive number");
    }

    const data: Prisma.ConsultencyBannerUpdateInput = {};

    if (payload.subHeading !== undefined) {
      data.subHeading = payload.subHeading?.trim() ?? null;
    }

    if (payload.heading !== undefined) {
      if (payload.heading.trim().length === 0) {
        throw new Error("Heading cannot be empty");
      }
      data.heading = payload.heading.trim();
    }

    if (payload.buttonText !== undefined) {
      data.buttonText = payload.buttonText?.trim() ?? null;
    }

    if (payload.buttonUrl !== undefined) {
      data.buttonUrl = payload.buttonUrl?.trim() ?? null;
    }

    if (payload.tagOne !== undefined) {
      data.tagOne = payload.tagOne?.trim() ?? null;
    }

    if (payload.tagTwo !== undefined) {
      data.tagTwo = payload.tagTwo?.trim() ?? null;
    }

    if (payload.tagThree !== undefined) {
      data.tagThree = payload.tagThree?.trim() ?? null;
    }

    if (payload.bgImageUrl !== undefined) {
      data.bgImageUrl = payload.bgImageUrl.trim();
    }

    if (payload.sortOrder !== undefined) {
      data.sortOrder = payload.sortOrder;
    }

    return prisma.consultencyBanner.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    const isExist = await prisma.consultencyBanner.findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new Error("Consultency banner not found");
    }

    await prisma.consultencyBanner.delete({
      where: { id },
    });

    const count = await prisma.consultencyBanner.count();

    return {
      message: "Consultency banner deleted successfully",
      remainingCount: count,
    };
  },
};