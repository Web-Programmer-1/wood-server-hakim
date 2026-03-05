import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import {
  ICreateServiceSectionPayload,
  IUpdateServiceSectionPayload,
} from "./services.interface";

export const ServiceSectionService = {
  create: async (payload: ICreateServiceSectionPayload) => {
    if (!payload.heading || payload.heading.trim().length === 0) {
      throw new Error("Heading is required");
    }

    if (!payload.bgImageUrl || payload.bgImageUrl.trim().length === 0) {
      throw new Error("Background image is required");
    }

    const heading = payload.heading.trim();

    const existing = await prisma.serviceSection.findFirst({
      where: {
        heading: heading,
      },
    });

    if (existing) {
      throw new Error("Service section with this heading already exists");
    }

    const data: Prisma.ServiceSectionCreateInput = {
      heading: payload.heading.trim(),
      description: payload.description?.trim() ?? null,

      primaryBtnText: payload.primaryBtnText?.trim() ?? null,
      primaryBtnUrl: payload.primaryBtnUrl?.trim() ?? null,
      secondaryBtnText: payload.secondaryBtnText?.trim() ?? null,
      secondaryBtnUrl: payload.secondaryBtnUrl?.trim() ?? null,

      bgImageUrl: payload.bgImageUrl,
      sortOrder: payload.sortOrder ?? 0,
    };

    const result = await prisma.serviceSection.create({ data });

    return result;
  },

  getAll: async () => {
    return prisma.serviceSection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  getById: async (id: string) => {
    const result = await prisma.serviceSection.findUnique({ where: { id } });
    if (!result) throw new Error("Service section not found");
    return result;
  },

  update: async (id: string, payload: IUpdateServiceSectionPayload) => {
    // ensure exists
    await ServiceSectionService.getById(id);

    if (payload.sortOrder !== undefined && payload.sortOrder < 0) {
      throw new Error("sortOrder must be a positive number");
    }

    const data: Prisma.ServiceSectionUpdateInput = {};

    if (payload.heading !== undefined) data.heading = payload.heading.trim();
    if (payload.description !== undefined)
      data.description = payload.description?.trim() ?? null;

    if (payload.primaryBtnText !== undefined)
      data.primaryBtnText = payload.primaryBtnText?.trim() ?? null;
    if (payload.primaryBtnUrl !== undefined)
      data.primaryBtnUrl = payload.primaryBtnUrl?.trim() ?? null;

    if (payload.secondaryBtnText !== undefined)
      data.secondaryBtnText = payload.secondaryBtnText?.trim() ?? null;
    if (payload.secondaryBtnUrl !== undefined)
      data.secondaryBtnUrl = payload.secondaryBtnUrl?.trim() ?? null;

    if (payload.bgImageUrl !== undefined)
      data.bgImageUrl = payload.bgImageUrl.trim();

    if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder;

    return prisma.serviceSection.update({
      where: { id },
      data,
    });
  },

delete: async (id: string) => {
  const isExist = await prisma.serviceSection.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new Error("Service Banner not found");
  }

  // delete
  await prisma.serviceSection.delete({
    where: { id },
  });

  // remaining count
  const total = await prisma.serviceSection.count();

  return {
    message: "Service section deleted successfully",
    count: total,
  };
},
};
