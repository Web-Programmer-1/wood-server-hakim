

import httpStatus from "http-status";
import { ApiError } from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import {
  cacheGetOrSet,
  stableQueryHash,
  CacheTTL,
  invalidateMachineReadCaches,
  invalidateCategoryReadCaches,
} from "../../../utils/httpCache";

const bumpMachineCaches = () =>
  Promise.all([
    invalidateMachineReadCaches(),
    invalidateCategoryReadCaches(),
  ]).catch(() => undefined);

import PDFDocument from "pdfkit";
import { Response } from "express";
import { Prisma } from "@prisma/client";
import {
  abortMultipart,
  buildMachineVideoKey,
  completeMultipart,
  initiateMultipart,
  signUploadPartUrl,
} from "../../../utils/s3Multipart";
import { deleteFileFromS3 } from "../../../utils/s3CleanUp";
import { MACHINE_VIDEO_MAX_BYTES } from "../../../config/machineUploadLimits";



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

const getMachinesUncached = async (params: GetMachinesParams) => {
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

export const getMachines = async (params: GetMachinesParams) => {
  const key = `cache:machine:list:${stableQueryHash(params as unknown as Record<string, unknown>)}`;
  return cacheGetOrSet(key, CacheTTL.machineList, () =>
    getMachinesUncached(params)
  );
};











const getFeaturedMachinesUncached = async () => {
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

const getFeaturedMachines = async () => {
  return cacheGetOrSet(
    "cache:machine:featured",
    CacheTTL.machineFeatured,
    getFeaturedMachinesUncached
  );
};

const searchMachinesUncached = async (keyword: string) => {
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

const searchMachines = async (keyword: string) => {
  const key = `cache:machine:search:${stableQueryHash({ q: String(keyword).trim() })}`;
  return cacheGetOrSet(key, CacheTTL.machineSearch, () =>
    searchMachinesUncached(keyword)
  );
};




const getMachineBySlugUncached = async (slug: string) => {
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

      customerImages: true,
      fileUploadLink: true,
      videoYoutubeLink: true,

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

const getMachineBySlug = async (slug: string) => {
  return cacheGetOrSet(
    `cache:machine:detail:${slug}`,
    CacheTTL.machineDetail,
    () => getMachineBySlugUncached(slug)
  );
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




const getRelatedMachinesUncached = async (slug: string) => {
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

const getRelatedMachines = async (slug: string) => {
  return cacheGetOrSet(
    `cache:machine:related:${slug}`,
    CacheTTL.machineRelated,
    () => getRelatedMachinesUncached(slug)
  );
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








// const createMachine = async (payload: any) => {
//   const {
//     name,
//     slug,
//     categoryId,
//     listPrice,
//     discountPercent,
//     bookedQty,
//     features,
//   } = payload;

//   if (!name || !slug || !categoryId) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Name, slug and categoryId are required"
//     );
//   }

//   if (!listPrice || Number(listPrice) <= 0) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "List price must be greater than 0"
//     );
//   }

//   const category = await prisma.category.findUnique({
//     where: { id: categoryId },
//   });

//   if (!category) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "Category not found"
//     );
//   }

//   const exist = await prisma.machine.findUnique({
//     where: { slug },
//   });

//   if (exist) {
//     throw new ApiError(
//       httpStatus.CONFLICT,
//       "Machine with this slug already exists"
//     );
//   }

//   let discountPrice: number | null = null;

//   if (discountPercent !== undefined && discountPercent !== null) {
//     const percent = Number(discountPercent);

//     if (percent < 0 || percent > 100) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         "Discount percent must be between 0 and 100"
//       );
//     }

//     discountPrice =
//       Number(listPrice) - Math.round((Number(listPrice) * percent) / 100);
//   }

//   const finalBookedQty =
//     bookedQty !== undefined ? Number(bookedQty) : 0;

//   if (finalBookedQty < 0) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Booked quantity cannot be negative"
//     );
//   }

//   if (features && !Array.isArray(features)) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Features must be an array"
//     );
//   }

//   if (features && Array.isArray(features)) {
//     for (const item of features) {
//       if (!item.title) {
//         throw new ApiError(
//           httpStatus.BAD_REQUEST,
//           "Each feature must have a title"
//         );
//       }
//     }
//   }

//   return prisma.machine.create({
//     data: {
//       name,
//       slug,
//       shortDesc: payload.shortDesc || null,
//       description: payload.description || null,
//       categoryId,
//       thumbnailImage: payload.thumbnailImage || null,
//       bannerImage: payload.bannerImage || null,

//       brand: payload.brand || null,
//       model: payload.model || null,

//       features: payload.features || [],
//       specifications: payload.specifications || {},
//       workSections: payload.workSections || [],
//       dynamicButtons: payload.dynamicButtons || [],

//       listPrice: Number(listPrice),
//       discountPercent:
//         discountPercent !== undefined && discountPercent !== null
//           ? Number(discountPercent)
//           : null,
//       discountPrice,

//       stockQuantity:
//         payload.stockQuantity !== undefined && payload.stockQuantity !== null
//           ? Number(payload.stockQuantity)
//           : 0,

//       bookedQty: finalBookedQty,
//       bookedName: payload.bookedName ?? null,
//       bookedPhone: payload.bookedPhone ?? null,
//       bookedEmail: payload.bookedEmail ?? null,
//       bookedNote: payload.bookedNote ?? null,

//       isFeatured: payload.isFeatured ?? false,
//       isActive: payload.isActive ?? true,
//     },
//     include: {
//       category: true,
//     },
//   });
// };












const createMachine = async (payload: any) => {
  const {
    name,
    slug,
    categoryId,
    subCategoryId,
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

  if (subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "SubCategory not found"
      );
    }

    if (subCategory.categoryId !== categoryId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "SubCategory does not belong to the selected category"
      );
    }
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

  const created = await prisma.machine.create({
    data: {
      name,
      slug,
      shortDesc: payload.shortDesc || null,
      description: payload.description || null,
      categoryId,
      subCategoryId: subCategoryId || null,
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

      customerImages: Array.isArray(payload.customerImages)
        ? payload.customerImages.filter(
            (u: unknown): u is string => typeof u === "string" && u.length > 0,
          )
        : [],
      fileUploadLink:
        typeof payload.fileUploadLink === "string" && payload.fileUploadLink.trim()
          ? payload.fileUploadLink.trim()
          : null,
      videoYoutubeLink:
        typeof payload.videoYoutubeLink === "string" && payload.videoYoutubeLink.trim()
          ? payload.videoYoutubeLink.trim()
          : null,

      isFeatured: payload.isFeatured ?? false,
      isActive: payload.isActive ?? true,
    },
    include: {
      category: true,
      subCategory: true,
    },
  });

  await bumpMachineCaches();

  return created;
};





const updateMachine = async (id: string, payload: any) => {
  const updateData: Record<string, any> = {};

  const stringFields = [
    "name", "slug", "shortDesc", "description", "brand", "model",
    "thumbnailImage", "bannerImage", "bookedName", "bookedPhone",
    "bookedEmail", "bookedNote", "fileUploadLink", "videoYoutubeLink"
  ];
  stringFields.forEach((field) => {
    if (payload[field] !== undefined) {
      const value = payload[field];
      if (
        ["fileUploadLink", "videoYoutubeLink"].includes(field) &&
        typeof value === "string"
      ) {
        const trimmed = value.trim();
        updateData[field] = trimmed.length > 0 ? trimmed : null;
      } else {
        updateData[field] = value;
      }
    }
  });

  if (payload.customerImages !== undefined) {
    updateData.customerImages = Array.isArray(payload.customerImages)
      ? payload.customerImages.filter(
          (u: unknown): u is string => typeof u === "string" && u.length > 0,
        )
      : [];
  }

  const jsonFields = ["features", "specifications", "workSections", "dynamicButtons"];
  jsonFields.forEach((field) => {
    if (payload[field] !== undefined) updateData[field] = payload[field];
  });

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true },
    });
    if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    updateData.categoryId = payload.categoryId;
  }

  if (payload.subCategoryId !== undefined) {
    if (payload.subCategoryId) {
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: payload.subCategoryId },
        select: { id: true, categoryId: true },
      });
      if (!subCategory) throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");
      if (payload.categoryId && subCategory.categoryId !== payload.categoryId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "SubCategory does not belong to the selected category");
      }
      updateData.subCategoryId = payload.subCategoryId;
    } else {
      updateData.subCategoryId = null;
    }
  }

  if (payload.slug && payload.slug !== (await prisma.machine.findUnique({ where: { id }, select: { slug: true } }))?.slug) {
    const existing = await prisma.machine.findUnique({ where: { slug: payload.slug }, select: { id: true } });
    if (existing) throw new ApiError(httpStatus.CONFLICT, "Machine slug already in use");
    updateData.slug = payload.slug;
  }

  const listPrice = payload.listPrice !== undefined ? Number(payload.listPrice) : undefined;
  if (listPrice !== undefined && listPrice <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "List price must be greater than 0");
  }
  if (listPrice !== undefined) updateData.listPrice = listPrice;

  if (payload.discountPercent !== undefined) {
    if (payload.discountPercent === null) {
      updateData.discountPercent = null;
      updateData.discountPrice = null;
    } else {
      const percent = Number(payload.discountPercent);
      if (percent < 0 || percent > 100) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Discount percent must be between 0 and 100");
      }
      updateData.discountPercent = percent;
      updateData.discountPrice = listPrice
        ? listPrice - Math.round((listPrice * percent) / 100)
        : undefined;
    }
  }

  const intFields = ["stockQuantity", "bookedQty"];
  intFields.forEach((field) => {
    if (payload[field] !== undefined) {
      const val = Number(payload[field]);
      if (val < 0 && field === "bookedQty") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Booked quantity cannot be negative");
      }
      updateData[field] = val;
    }
  });

  if (payload.isActive !== undefined) updateData.isActive = Boolean(payload.isActive);
  if (payload.isFeatured !== undefined) updateData.isFeatured = Boolean(payload.isFeatured);

  const updated = await prisma.machine.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailImage: true,
      bannerImage: true,
      listPrice: true,
      discountPrice: true,
      discountPercent: true,
      stockQuantity: true,
      isActive: true,
      isFeatured: true,
      categoryId: true,
      subCategoryId: true,
      brand: true,
      model: true,
      customerImages: true,
      fileUploadLink: true,
      videoYoutubeLink: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
    },
  });

  await bumpMachineCaches();

  return updated;
};





const updateMachineStatus = async (id: string, payload: any) => {
  if (typeof payload.isActive !== "boolean") {
    throw new Error(
   
      "isActive boolean value required"
    );
  }

  const statusUpdated = await prisma.machine.update({
    where: { id },
    data: {
      isActive: payload.isActive,
      isFeatured: payload.isFeatured,
    },
  });

  await bumpMachineCaches();

  return statusUpdated;
};

const deleteMachine = async (id: string) => {
  const machine = await prisma.machine.findUnique({
    where: { id },
  });

  if (!machine) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  const deleted = await prisma.machine.delete({
    where: { id },
  });

  await bumpMachineCaches();

  return deleted;
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

  const updatedImg = await prisma.$transaction(async (tx) => {
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

  await bumpMachineCaches();
  return updatedImg;
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

  const imgResult = await prisma.machineImage.createMany({
    data,
  });

  await bumpMachineCaches();

  return imgResult;
};



const deleteMachineImage = async (imageId: string) => {
  const image = await prisma.machineImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new ApiError(httpStatus.NOT_FOUND, "Image not found");
  }

  // ❗ Optional: এখানে S3 delete করতে পারো

  const delImg = await prisma.machineImage.delete({
    where: { id: imageId },
  });

  await bumpMachineCaches();

  return delImg;
};






// ---------------- Machine Operations 


const uploadMachineVideo = async (
  machineId: string,
  file: Express.MulterS3.File
) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Video file required");
  }

  const vid = await prisma.machineVideo.create({
    data: {
      machineId,
      url: file.location,
    },
  });

  await bumpMachineCaches();

  return vid;
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

  const vUp = await prisma.machineVideo.update({
    where: { id },
    data: {
      url: file.location,
    },
  });

  await bumpMachineCaches();

  return vUp;
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

  await bumpMachineCaches();

  return null;
};


// ---------------- Multipart Video Upload ----------------

const MIN_PART_SIZE = 5 * 1024 * 1024; // S3 minimum
const MAX_PART_SIZE = 100 * 1024 * 1024;
const MAX_PARTS = 10000;

const initiateMachineVideoMultipart = async (params: {
  machineId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}) => {
  const { machineId, fileName, fileSize, contentType } = params;

  if (!fileName || typeof fileName !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "fileName is required");
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "fileSize must be > 0");
  }
  if (fileSize > MACHINE_VIDEO_MAX_BYTES) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `File too large. Max ${MACHINE_VIDEO_MAX_BYTES} bytes.`,
    );
  }
  if (!contentType?.startsWith("video/")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only video files are allowed");
  }

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
    select: { id: true },
  });
  if (!machine) {
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  const key = buildMachineVideoKey(fileName);
  const { uploadId } = await initiateMultipart({ key, contentType });

  return { key, uploadId };
};

const signMachineVideoPart = async (params: {
  key: string;
  uploadId: string;
  partNumber: number;
}) => {
  const { key, uploadId, partNumber } = params;

  if (!key || !uploadId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "key and uploadId are required");
  }
  if (!key.startsWith("machine-videos/")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid object key");
  }
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > MAX_PARTS) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `partNumber must be between 1 and ${MAX_PARTS}`,
    );
  }

  const url = await signUploadPartUrl({ key, uploadId, partNumber });
  return { url };
};

const completeMachineVideoMultipart = async (params: {
  machineId: string;
  videoId?: string | null;
  key: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
}) => {
  const { machineId, videoId, key, uploadId, parts } = params;

  if (!key?.startsWith("machine-videos/") || !uploadId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid key or uploadId");
  }
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "parts array is required");
  }
  for (const p of parts) {
    if (
      !Number.isInteger(p.PartNumber) ||
      p.PartNumber < 1 ||
      p.PartNumber > MAX_PARTS ||
      typeof p.ETag !== "string" ||
      !p.ETag
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid part entry");
    }
  }

  const { location } = await completeMultipart({ key, uploadId, parts });

  if (videoId) {
    const existing = await prisma.machineVideo.findUnique({
      where: { id: videoId },
    });
    if (!existing) {
      throw new ApiError(httpStatus.NOT_FOUND, "Machine video not found");
    }
    const updated = await prisma.machineVideo.update({
      where: { id: videoId },
      data: { url: location },
    });
    await bumpMachineCaches();
    // best-effort delete of old S3 object
    if (existing.url && existing.url !== location) {
      void deleteFileFromS3(existing.url);
    }
    return updated;
  }

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
    select: { id: true },
  });
  if (!machine) {
    // orphaned object — clean up
    void deleteFileFromS3(location);
    throw new ApiError(httpStatus.NOT_FOUND, "Machine not found");
  }

  const created = await prisma.machineVideo.create({
    data: { machineId, url: location },
  });
  await bumpMachineCaches();
  return created;
};

const abortMachineVideoMultipart = async (params: {
  key: string;
  uploadId: string;
}) => {
  const { key, uploadId } = params;
  if (!key?.startsWith("machine-videos/") || !uploadId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid key or uploadId");
  }
  await abortMultipart({ key, uploadId });
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
  initiateMachineVideoMultipart,
  signMachineVideoPart,
  completeMachineVideoMultipart,
  abortMachineVideoMultipart,
};















































































