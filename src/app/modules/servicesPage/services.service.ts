import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { ICreateServiceSectionPayload } from "./services.interface";

export const ServiceSectionService = {
  create: async (payload: ICreateServiceSectionPayload) => {
    
    if (!payload.heading || payload.heading.trim().length === 0) {
      throw new Error("Heading is required");
    }

    if (!payload.bgImageUrl || payload.bgImageUrl.trim().length === 0) {
      throw new Error("Background image is required");
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
};