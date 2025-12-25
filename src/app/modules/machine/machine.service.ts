

import httpStatus from "http-status";
import { ApiError } from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { GetMachinesParams } from "./machine.interface";

// const getMachines = async () => {
//   return prisma.machine.findMany({
//     where: {
//       isActive: true,
//     },
//     select: {
//       id: true,
//       name: true,
//       slug: true,
//       thumbnailImage: true,
//       category: {
//         select: {
//           id: true,
//           name: true,
//           slug: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
// };






const getMachines = async (params: GetMachinesParams) => {
  const {
    page,
    limit,
    search,
    categoryId,
    sortBy,
    sortOrder,
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  // 🔍 Search by name OR slug
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  // 🎯 Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // 📦 Query data
  const [data, total] = await Promise.all([
    prisma.machine.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailImage: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.machine.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};













const getFeaturedMachines = async () => {
  return prisma.machine.findMany({
    where: {
      isFeatured: true,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailImage: true,
    },
  });
};

const searchMachines = async (keyword: string) => {
  if (!keyword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Search keyword is required");
  }

  return prisma.machine.findMany({
    where: {
      isActive: true,
      name: {
        contains: keyword,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailImage: true,
    },
  });
};

const getMachineBySlug = async (slug: string) => {
  if (!slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Machine slug is required");
  }

  const machine = await prisma.machine.findUnique({
    where: { slug },
    include: {
      images: {
        select: {
          id: true,
          url: true,
          isPrimary: true,
        },
      },
      videos: {
        select: {
          id: true,
          url: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!machine || !machine.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  return machine;
};

const getRelatedMachines = async (slug: string) => {
  const machine = await prisma.machine.findUnique({
    where: { slug },
  });

  if (!machine) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  return prisma.machine.findMany({
    where: {
      categoryId: machine.categoryId,
      id: {
        not: machine.id,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailImage: true,
    },
    take: 6,
  });
};

const createMachine = async (payload: any) => {
  if (!payload.name || !payload.slug || !payload.categoryId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Name, slug and categoryId are required"
    );
  }

  const exist = await prisma.machine.findUnique({
    where: { slug: payload.slug },
  });

  if (exist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Machine with this slug already exists"
    );
  }

  return prisma.machine.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      shortDesc: payload.shortDesc,
      description: payload.description,
      categoryId: payload.categoryId,
      thumbnailImage: payload.thumbnailImage,
      bannerImage: payload.bannerImage,
      brand: payload.brand,
      model: payload.model,
      features: payload.features || {},
      specifications: payload.specifications || {},
      workSections: payload.workSections || [],
      dynamicButtons: payload.dynamicButtons || [],
      isFeatured: payload.isFeatured || false,
      isActive: payload.isActive ?? true,
    },
  });
};

const updateMachine = async (id: string, payload: any) => {
  const machine = await prisma.machine.findUnique({
    where: { id },
  });

  if (!machine) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  if (payload.slug && payload.slug !== machine.slug) {
    const slugExist = await prisma.machine.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExist) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Machine slug already in use"
      );
    }
  }

  return prisma.machine.update({
    where: { id },
    data: payload,
  });
};

const updateMachineStatus = async (id: string, payload: any) => {
  if (typeof payload.isActive !== "boolean") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "isActive boolean value required"
    );
  }

  return prisma.machine.update({
    where: { id },
    data: {
      isActive: payload.isActive,
      isFeatured: payload.isFeatured,
    },
  });
};

const deleteMachine = async (id: string) => {
  const machine = await prisma.machine.findUnique({
    where: { id },
  });

  if (!machine) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  return prisma.machine.delete({
    where: { id },
  });
};

const uploadMachineImages = async (
  machineId: string,
  files: Express.MulterS3.File[]
) => {
  if (!files || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No images uploaded");
  }

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
  });

  if (!machine) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  const data = files.map(file => ({
    machineId,
    url: file.location,
  }));

  return prisma.machineImage.createMany({
    data,
  });
};

const uploadMachineVideo = async (
  machineId: string,
  file: Express.MulterS3.File
) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Video file required");
  }

  return prisma.machineVideo.create({
    data: {
      machineId,
      url: file.location,
    },
  });
};

const deleteMachineImage = async (machineId: string, imageId: string) => {
  const image = await prisma.machineImage.findUnique({
    where: { id: imageId },
  });

  if (!image || image.machineId !== machineId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Image not found");
  }

  return prisma.machineImage.delete({
    where: { id: imageId },
  });
};

export const MachineService = {
  getMachines,
  getFeaturedMachines,
  searchMachines,
  getMachineBySlug,
  getRelatedMachines,
  createMachine,
  updateMachine,
  updateMachineStatus,
  deleteMachine,
  uploadMachineImages,
  uploadMachineVideo,
  deleteMachineImage,
};















































































