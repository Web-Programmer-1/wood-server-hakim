

import httpStatus from "http-status";
import { ApiError } from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { GetMachinesParams, IMachine } from "./machine.interface";




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
        stockQuantity: true,
        images:{
          select: {
            id: true,
            url: true,
            isPrimary: true,
          },
        },
       videos:{
        select:{
          id:true,
          url:true,
        },
       },
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

    select: {
      id: true,
      name: true,
      slug: true,
      shortDesc: true,
      description: true,
      thumbnailImage: true,
      bannerImage: true,
      
      stockQuantity: true, 
      isActive: true,
      brand: true,
      model: true,
      features: true,
      specifications: true,
      workSections: true,
      dynamicButtons: true,
      listPrice: true,
      discountPercent: true,
      discountPrice: true,
      createdAt: true,
      bookedQty: true,
      bookedName: true,
      bookedPhone: true,
      bookedEmail: true,
      bookedNote: true,

      

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
  const {
    name,
    slug,
    categoryId,
    listPrice,
    discountPercent,
    bookedQty,
  } = payload;

  if (!name || !slug || !categoryId) {
    throw new Error(
    
      "Name, slug and categoryId are required"
    );
  }

  if (!listPrice || Number(listPrice) <= 0) {
    throw new Error(
   
      "List price must be greater than 0"
    );
  }

  const exist = await prisma.machine.findUnique({
    where: { slug },
  });

  if (exist) {
    throw new Error(
      "Machine with this slug already exists"
    );
  }

  let discountPrice: number | null = null;
  if (discountPercent !== undefined && discountPercent !== null) {
    const percent = Number(discountPercent);
    if (percent < 0 || percent > 100) {
      throw new Error(
  
        "Discount percent must be between 0 and 100"
      );
    }

    discountPrice =
      Number(listPrice) -
      Math.round((Number(listPrice) * percent) / 100);
  }

  const finalBookedQty =
    bookedQty !== undefined ? Number(bookedQty) : 0;

  if (finalBookedQty < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booked quantity cannot be negative"
    );
  }

  return prisma.machine.create({
    data: {
      name,
      slug,
      shortDesc: payload.shortDesc,
      description: payload.description,
      categoryId,
      thumbnailImage: payload.thumbnailImage,
      bannerImage: payload.bannerImage,

      brand: payload.brand,
      model: payload.model,

      features: payload.features || {},
      specifications: payload.specifications || {},
      workSections: payload.workSections || [],
      dynamicButtons: payload.dynamicButtons || [],

      listPrice: Number(listPrice),
      discountPercent:
        discountPercent !== undefined ? Number(discountPercent) : null,
      discountPrice,

      stockQuantity: payload.stockQuantity
        ? Number(payload.stockQuantity)
        : 0,

    
      bookedQty: finalBookedQty,
      bookedName: payload.bookedName ?? null,
      bookedPhone: payload.bookedPhone ?? null,
      bookedEmail: payload.bookedEmail ?? null,
      bookedNote: payload.bookedNote ?? null,

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
    throw new Error( "Machine not found");
  }

  // 🔴 Slug uniqueness check
  if (payload.slug && payload.slug !== machine.slug) {
    const slugExist = await prisma.machine.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExist) {
      throw new Error(
  
        "Machine slug already in use"
      );
    }
  }

  // 🧮 Price recalculation logic
  const listPrice =
    payload.listPrice !== undefined
      ? Number(payload.listPrice)
      : machine.listPrice;

  const discountPercent =
    payload.discountPercent !== undefined
      ? payload.discountPercent !== null
        ? Number(payload.discountPercent)
        : null
      : machine.discountPercent;

  let discountPrice = machine.discountPrice;

  if (discountPercent !== null && discountPercent !== undefined) {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error(
    
        "Discount percent must be between 0 and 100"
      );
    }

    discountPrice =
      listPrice -
      Math.round((listPrice * discountPercent) / 100);
  } else {
    discountPrice = null;
  }

  return prisma.machine.update({
    where: { id },
    data: {
      ...payload,
      listPrice,
      discountPercent,
      discountPrice,
    },
  });
};




const updateMachineStatus = async (id: string, payload: any) => {
  if (typeof payload.isActive !== "boolean") {
    throw new Error(
   
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


type GetAllMachineImagesParams = {
  page: number;
  limit: number;
  search?: string;
};

const getAllMachineImages = async ({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      {
        url: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        machine: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.machineImage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        isPrimary: true,
        machine: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.machineImage.count({ where }),
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





const updateMachineImage = async (
  id: string,
  payload: {
    url?: string;
    isPrimary?: boolean;
  }
) => {
  const image = await prisma.machineImage.findUnique({
    where: { id },
  });

  if (!image) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine image not found");
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Nothing to update");
  }

  return prisma.$transaction(async (tx) => {
    // 🔴 One primary image per machine
    if (payload.isPrimary === true) {
      await tx.machineImage.updateMany({
        where: {
          machineId: image.machineId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    return tx.machineImage.update({
      where: { id },
      data: payload,
    });
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



const deleteMachineImage = async (imageId: string) => {
  const image = await prisma.machineImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new ApiError(httpStatus.NOT_FOUND, "Image not found");
  }

  // ❗ Optional: এখানে S3 delete করতে পারো

  return prisma.machineImage.delete({
    where: { id: imageId },
  });
};






// ---------------- Machine Operations 


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



const getAllMachineVideos = async ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.machineVideo.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" },
      select: {
        id: true,
        url: true,
        machine: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.machineVideo.count(),
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


const updateMachineVideo = async (
  id: string,
  file: Express.MulterS3.File
) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Video file required");
  }

  const video = await prisma.machineVideo.findUnique({
    where: { id },
  });

  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine video not found");
  }

  return prisma.machineVideo.update({
    where: { id },
    data: {
      url: file.location,
    },
  });
};




const deleteMachineVideo = async (id: string) => {
  const video = await prisma.machineVideo.findUnique({
    where: { id },
  });

  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine video not found");
  }

  // ❗ Optional: S3 delete here

  await prisma.machineVideo.delete({
    where: { id },
  });

  return null;
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
  updateMachineImage,
  getAllMachineImages,
  getAllMachineVideos,
  updateMachineVideo,
  deleteMachineVideo,
};















































































