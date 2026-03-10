

import httpStatus from "http-status";
import { ApiError } from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";

import PDFDocument from "pdfkit";
import { Response } from "express";
import { Prisma } from "@prisma/client";



// const getMachines = async (params: GetMachinesParams) => {
//   const {
//     page,
//     limit,
//     search,
//     categoryId,
//     sortBy,
//     sortOrder,
//   } = params;

//   const skip = (page - 1) * limit;

//   const where: any = {
//     isActive: true,
//   };

//   // 🔍 Search by name OR slug
//   if (search) {
//     where.OR = [
//       { name: { contains: search, mode: "insensitive" } },
//       { slug: { contains: search, mode: "insensitive" } },
//     ];
//   }

//   // 🎯 Category filter
//   if (categoryId) {
//     where.categoryId = categoryId;
//   }

//   // 📦 Query data
//   const [data, total] = await Promise.all([
//     prisma.machine.findMany({
//       where,
//       skip,
//       take: limit,
//       select: {
//         id: true,
//         name: true,
//         slug: true,
//         thumbnailImage: true,
//         stockQuantity: true,
//         images:{
//           select: {
//             id: true,
//             url: true,
//             isPrimary: true,
//           },
//         },
//        videos:{
//         select:{
//           id:true,
//           url:true,
//         },
//        },
//         createdAt: true,
//         category: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//           },
//         },
//       },
//       orderBy: {
//         [sortBy]: sortOrder,
//       },
//     }),
//     prisma.machine.count({ where }),
//   ]);

//   return {
//     data,
//     meta: {
//       page,
//       limit,
//       total,
//       totalPage: Math.ceil(total / limit),
//     },
//   };
// };



// type SortBy = "createdAt" | "name";
// type SortOrder = "asc" | "desc";

// type GetMachinesParams = {
//   page: number;
//   limit: number;
//   search?: string;
//   categoryId?: string;
//   sortBy: SortBy;
//   sortOrder: SortOrder;
//   grouped?: boolean; // ✅ same API flag
// };

// export const getMachines = async (params: GetMachinesParams) => {
//   const {
//     page,
//     limit,
//     search,
//     categoryId,
//     sortBy,
//     sortOrder,
//     grouped,
//   } = params;

//   const safeSortBy: SortBy = sortBy === "name" ? "name" : "createdAt";
//   const safeSortOrder: SortOrder = sortOrder === "asc" ? "asc" : "desc";

//   const trimmedSearch = search?.trim();
//   const searchWhere =
//     trimmedSearch && trimmedSearch.length > 0
//       ? {
//           OR: [
//             { name: { contains: trimmedSearch, mode: "insensitive" } },
//             { slug: { contains: trimmedSearch, mode: "insensitive" } },
//           ],
//         }
//       : {};

//   // ✅ MODE-1: grouped=true => প্রতি category তে 6টা করে
// if (grouped) {
//   const PER_CATEGORY_LIMIT = 6;

//   const categories = await prisma.category.findMany({
//     where: { parentId: null },
//     select: {
//       id: true,
//       name: true,
//       slug: true,
//       description: true,
//       children: { select: { id: true, name: true, slug: true } },
//     },
//     orderBy: { name: "asc" },
//   });

//   const data = await Promise.all(
//     categories.map(async (cat) => {
//       // ✅ strongly typed where
//       const where: Prisma.MachineWhereInput = {
//         isActive: true,
//         categoryId: cat.id,
//       };

//       // ✅ only add OR when search exists (no undefined)
//       if (trimmedSearch) {
//         where.OR = [
//           {
//             name: {
//               contains: trimmedSearch,
//               mode: Prisma.QueryMode.insensitive,
//             },
//           },
//           {
//             slug: {
//               contains: trimmedSearch,
//               mode: Prisma.QueryMode.insensitive,
//             },
//           },
//         ];
//       }

//       const [machines, total] = await Promise.all([
//         prisma.machine.findMany({
//           where,
//           take: PER_CATEGORY_LIMIT,
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//             thumbnailImage: true,
//             stockQuantity: true,
//             listPrice: true,
//             discountPercent: true,
//             discountPrice: true,
//             createdAt: true,
//             category: { select: { id: true, name: true, slug: true } },
//             images: { select: { id: true, url: true, isPrimary: true } },
//             videos: { select: { id: true, url: true } },
//           },
//           orderBy: { [safeSortBy]: safeSortOrder },
//         }),
//         // ✅ count must use same where
//         prisma.machine.count({ where }),
//       ]);

//       return {
//         category: cat,
//         machines,
//         meta: {
//           total,
//           limit: PER_CATEGORY_LIMIT,
//           totalPage: Math.ceil(total / PER_CATEGORY_LIMIT),
//           hasMore: total > PER_CATEGORY_LIMIT,
//         },
//       };
//     })
//   );

//   const filtered = trimmedSearch ? data.filter((x) => x.meta.total > 0) : data;

//   return {
//     data: filtered,
//     meta: {
//       grouped: true,
//       perCategoryLimit: PER_CATEGORY_LIMIT,
//       totalCategory: filtered.length,
//     },
//   };
// }

//   // ✅ MODE-2: single list (existing behavior) + pagination + search
//   const safePage = Math.max(1, Number(page) || 1);

//   // Single list mode এ limit কে clamp করে দাও (UI তে 6 চাইলে 6 পাঠাবে)
//   const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
//   const skip = (safePage - 1) * safeLimit;

//   const where: any = {
//     isActive: true,
//     ...searchWhere,
//   };

//   if (categoryId) where.categoryId = categoryId;

//   const [data, total] = await Promise.all([
//     prisma.machine.findMany({
//       where,
//       skip,
//       take: safeLimit,
//       select: {
//         id: true,
//         name: true,
//         slug: true,
//         thumbnailImage: true,
//         stockQuantity: true,
//         listPrice: true,
//         discountPercent: true,
//         discountPrice: true,
//         createdAt: true,
//         category: { select: { id: true, name: true, slug: true } },
//         images: { select: { id: true, url: true, isPrimary: true } },
//         videos: { select: { id: true, url: true } },
//       },
//       orderBy: { [safeSortBy]: safeSortOrder },
//     }),
//     prisma.machine.count({ where }),
//   ]);

//   return {
//     data,
//     meta: {
//       grouped: false,
//       page: safePage,
//       limit: safeLimit,
//       total,
//       totalPage: Math.ceil(total / safeLimit),
//     },
//   };
// };





















type SortBy = "createdAt" | "name";
type SortOrder = "asc" | "desc";

type GetMachinesParams = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  grouped?: boolean;
};

export const getMachines = async (params: GetMachinesParams) => {
  const { page, limit, search, categoryId, sortBy, sortOrder, grouped } = params;

  const safeSortBy: SortBy = sortBy === "name" ? "name" : "createdAt";
  const safeSortOrder: SortOrder = sortOrder === "asc" ? "asc" : "desc";

  const trimmedSearch = search?.trim();

  const searchWhere: Prisma.MachineWhereInput =
    trimmedSearch
      ? {
          OR: [
            { name: { contains: trimmedSearch, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: trimmedSearch, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

  // ✅ MODE-1: grouped=true
  if (grouped) {
    const PER_CATEGORY_LIMIT = 6;

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        children: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: "asc" },
    });

    const data = await Promise.all(
      categories.map(async (cat) => {
        const where: Prisma.MachineWhereInput = {
          isActive: true,
          categoryId: cat.id,
          ...searchWhere,
        };

        const [machines, total] = await Promise.all([
          prisma.machine.findMany({
            where,
            take: PER_CATEGORY_LIMIT,
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnailImage: true,
              stockQuantity: true,
              listPrice: true,
              discountPercent: true,
              discountPrice: true,
              createdAt: true,
              category: { select: { id: true, name: true, slug: true } },
              images: { select: { id: true, url: true, isPrimary: true } },
              videos: { select: { id: true, url: true } },
            },
            orderBy: { [safeSortBy]: safeSortOrder },
          }),
          prisma.machine.count({ where }),
        ]);

        return {
          category: cat,
          machines,
          meta: {
            total,
            limit: PER_CATEGORY_LIMIT,
            totalPage: Math.ceil(total / PER_CATEGORY_LIMIT),
            hasMore: total > PER_CATEGORY_LIMIT,
          },
        };
      })
    );

    const filtered = trimmedSearch ? data.filter((x) => x.meta.total > 0) : data;

    return {
      data: filtered,
      meta: {
        grouped: true,
        perCategoryLimit: PER_CATEGORY_LIMIT,
        totalCategory: filtered.length,
      },
    };
  }

  // ✅ MODE-2: single list (pagination)
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const skip = (safePage - 1) * safeLimit;

  const where: Prisma.MachineWhereInput = {
    isActive: true,
    ...searchWhere,
  };

  if (categoryId) where.categoryId = categoryId;

  const [data, total] = await Promise.all([
    prisma.machine.findMany({
      where,
      skip,
      take: safeLimit,
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailImage: true,
        stockQuantity: true,
        listPrice: true,
        discountPercent: true,
        discountPrice: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true, isPrimary: true } },
        videos: { select: { id: true, url: true } },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
    }),
    prisma.machine.count({ where }),
  ]);

  return {
    data,
    meta: {
 
      page: safePage,
      limit: safeLimit,
      total,
      totalPage: Math.ceil(total / safeLimit),
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






const generateMachineSpecPdf = async (machine: any, res: Response) => {
  const doc = new PDFDocument({ margin: 40 });

  doc.pipe(res as any);

  // ======================
  // Title
  // ======================
  doc
    .fontSize(20)
    .text(machine.name, { align: "center" })
    .moveDown();

  doc
    .fontSize(12)
    .text("Product Specifications", { underline: true })
    .moveDown();

  // ======================
  // Specifications Table
  // ======================
  const specs = machine.specifications || {};

  Object.entries(specs).forEach(([key, value]) => {
    doc
      .fontSize(10)
      .text(`${key.toUpperCase()}:`, { continued: true })
      .text(` ${value}`)
      .moveDown(0.5);
  });

  doc.end();
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




// const createMachine = async (payload: any) => {
//   const {
//     name,
//     slug,
//     categoryId,
//     listPrice,
//     discountPercent,
//     bookedQty,
//   } = payload;

//   if (!name || !slug || !categoryId) {
//     throw new Error(
    
//       "Name, slug and categoryId are required"
//     );
//   }

//   if (!listPrice || Number(listPrice) <= 0) {
//     throw new Error(
   
//       "List price must be greater than 0"
//     );
//   }

//   const exist = await prisma.machine.findUnique({
//     where: { slug },
//   });

//   if (exist) {
//     throw new Error(
//       "Machine with this slug already exists"
//     );
//   }

//   let discountPrice: number | null = null;
//   if (discountPercent !== undefined && discountPercent !== null) {
//     const percent = Number(discountPercent);
//     if (percent < 0 || percent > 100) {
//       throw new Error(
  
//         "Discount percent must be between 0 and 100"
//       );
//     }

//     discountPrice =
//       Number(listPrice) -
//       Math.round((Number(listPrice) * percent) / 100);
//   }

//   const finalBookedQty =
//     bookedQty !== undefined ? Number(bookedQty) : 0;

//   if (finalBookedQty < 0) {
    
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Booked quantity cannot be negative"
//     );
//   }

//   return prisma.machine.create({
//     data: {
//       name,
//       slug,
//       shortDesc: payload.shortDesc,
//       description: payload.description,
//       categoryId,
//       thumbnailImage: payload.thumbnailImage,
//       bannerImage: payload.bannerImage,

//       brand: payload.brand,
//       model: payload.model,

//       features: payload.features || {},
//       specifications: payload.specifications || {},
//       workSections: payload.workSections || [],
//       dynamicButtons: payload.dynamicButtons || [],

//       listPrice: Number(listPrice),
//       discountPercent:
//         discountPercent !== undefined ? Number(discountPercent) : null,
//       discountPrice,

//       stockQuantity: payload.stockQuantity
//         ? Number(payload.stockQuantity)
//         : 0,

    
//       bookedQty: finalBookedQty,
//       bookedName: payload.bookedName ?? null,
//       bookedPhone: payload.bookedPhone ?? null,
//       bookedEmail: payload.bookedEmail ?? null,
//       bookedNote: payload.bookedNote ?? null,

//       isFeatured: payload.isFeatured || false,
//       isActive: payload.isActive ?? true,
//     },
//   });
// };








const createMachine = async (payload: any) => {
  const {
    name,
    slug,
    categoryId,
    listPrice,
    discountPercent,
    bookedQty,
    features,
  } = payload;

  if (!name || !slug || !categoryId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Name, slug and categoryId are required"
    );
  }

  if (!listPrice || Number(listPrice) <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "List price must be greater than 0"
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Category not found"
    );
  }

  const exist = await prisma.machine.findUnique({
    where: { slug },
  });

  if (exist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Machine with this slug already exists"
    );
  }

  let discountPrice: number | null = null;

  if (discountPercent !== undefined && discountPercent !== null) {
    const percent = Number(discountPercent);

    if (percent < 0 || percent > 100) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Discount percent must be between 0 and 100"
      );
    }

    discountPrice =
      Number(listPrice) - Math.round((Number(listPrice) * percent) / 100);
  }

  const finalBookedQty =
    bookedQty !== undefined ? Number(bookedQty) : 0;

  if (finalBookedQty < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booked quantity cannot be negative"
    );
  }

  if (features && !Array.isArray(features)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Features must be an array"
    );
  }

  if (features && Array.isArray(features)) {
    for (const item of features) {
      if (!item.title) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Each feature must have a title"
        );
      }
    }
  }

  return prisma.machine.create({
    data: {
      name,
      slug,
      shortDesc: payload.shortDesc || null,
      description: payload.description || null,
      categoryId,
      thumbnailImage: payload.thumbnailImage || null,
      bannerImage: payload.bannerImage || null,

      brand: payload.brand || null,
      model: payload.model || null,

      features: payload.features || [],
      specifications: payload.specifications || {},
      workSections: payload.workSections || [],
      dynamicButtons: payload.dynamicButtons || [],

      listPrice: Number(listPrice),
      discountPercent:
        discountPercent !== undefined && discountPercent !== null
          ? Number(discountPercent)
          : null,
      discountPrice,

      stockQuantity:
        payload.stockQuantity !== undefined && payload.stockQuantity !== null
          ? Number(payload.stockQuantity)
          : 0,

      bookedQty: finalBookedQty,
      bookedName: payload.bookedName ?? null,
      bookedPhone: payload.bookedPhone ?? null,
      bookedEmail: payload.bookedEmail ?? null,
      bookedNote: payload.bookedNote ?? null,

      isFeatured: payload.isFeatured ?? false,
      isActive: payload.isActive ?? true,
    },
    include: {
      category: true,
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
  generateMachineSpecPdf,
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















































































