import { Prisma } from "@prisma/client";
import { ICreateTestimonialPayload, IGetAllTestimonialQuery } from "./testimoniral.interface";
import { prisma } from "../../../shared/prisma";

export const TestimonialService = {
  create: async (payload: ICreateTestimonialPayload) => {
    // minimum validations
    const vt = payload.videoType?.trim();



    const personName = await prisma.testimonialSection.findFirst({
        where:{
          personName:payload.personName
        }

    })

   if(personName){
    throw new Error("Person name already exists");
   };



    if (vt && vt !== "YOUTUBE" && vt !== "UPLOAD") {
      throw new Error('videoType must be "YOUTUBE" or "UPLOAD"');
    }

    if (vt === "YOUTUBE" && (!payload.youtubeUrl || payload.youtubeUrl.trim().length === 0)) {
      throw new Error("youtubeUrl is required when videoType is YOUTUBE");
    }

    if (vt === "UPLOAD" && (!payload.videoUrl || payload.videoUrl.trim().length === 0)) {
      throw new Error("videoUrl is required when videoType is UPLOAD");
    }

    if (payload.sortOrder !== undefined && payload.sortOrder < 0) {
      throw new Error("sortOrder must be a positive number");
    }

    const data: Prisma.TestimonialSectionCreateInput = {
      avatarUrl: payload.avatarUrl ?? null,
      description: payload.description?.trim() ?? null,

      personName: payload.personName?.trim() ?? null,
      companyName: payload.companyName?.trim() ?? null,

      cardBgImageUrl: payload.cardBgImageUrl ?? null,

      videoType: vt ?? null,
      youtubeUrl: payload.youtubeUrl?.trim() ?? null,
      videoUrl: payload.videoUrl?.trim() ?? null,

      sortOrder: payload.sortOrder ?? 0,
    };

    return prisma.testimonialSection.create({ data });
  },



    getAll: async (query: IGetAllTestimonialQuery) => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.testimonialSection.findMany({
        skip,
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.testimonialSection.count(),
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
  const result = await prisma.testimonialSection.findUnique({
    where: { id },
  });

  if (!result) {
    throw new Error("Testimonial not found");
  }

  return result;
},



update: async (id: string, payload: any) => {

  const isExist = await prisma.testimonialSection.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new Error("Testimonial not found");
  }

  const vt = payload.videoType?.trim();

  if (vt && vt !== "YOUTUBE" && vt !== "UPLOAD") {
    throw new Error('videoType must be "YOUTUBE" or "UPLOAD"');
  }

  if (vt === "YOUTUBE" && (!payload.youtubeUrl || payload.youtubeUrl.trim().length === 0)) {
    throw new Error("youtubeUrl is required when videoType is YOUTUBE");
  }

  if (vt === "UPLOAD" && (!payload.videoUrl || payload.videoUrl.trim().length === 0)) {
    throw new Error("videoUrl is required when videoType is UPLOAD");
  }

  const data: any = {};

  if (payload.avatarUrl !== undefined) data.avatarUrl = payload.avatarUrl;
  if (payload.cardBgImageUrl !== undefined) data.cardBgImageUrl = payload.cardBgImageUrl;

  if (payload.description !== undefined) data.description = payload.description?.trim() ?? null;
  if (payload.personName !== undefined) data.personName = payload.personName?.trim() ?? null;
  if (payload.companyName !== undefined) data.companyName = payload.companyName?.trim() ?? null;

  if (payload.videoType !== undefined) data.videoType = payload.videoType;
  if (payload.youtubeUrl !== undefined) data.youtubeUrl = payload.youtubeUrl?.trim() ?? null;
  if (payload.videoUrl !== undefined) data.videoUrl = payload.videoUrl ?? null;

  if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder;

  const result = await prisma.testimonialSection.update({
    where: { id },
    data,
  });

  return result;
},


delete: async (id: string) => {

  const isExist = await prisma.testimonialSection.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new Error("Testimonial not found");
  }

  await prisma.testimonialSection.delete({
    where: { id },
  });

  const count = await prisma.testimonialSection.count();

  return {
    message: "Testimonial deleted successfully",
    remainingCount: count,
  };
},






};