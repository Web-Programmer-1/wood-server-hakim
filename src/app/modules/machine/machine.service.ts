import { prisma } from "../../shared/prisma";





export const createMachineService = async (payload: any) => {
  const errors: Record<string, string> = {};

  /* ================= REQUIRED FIELD CHECK ================= */
  if (!payload?.title || payload.title.trim() === "") {
    errors.title = "Title is required";
  }

  if (!payload?.slug || payload.slug.trim() === "") {
    errors.slug = "Slug is required";
  }

  if (!payload?.categoryId || payload.categoryId.trim() === "") {
    errors.categoryId = "Category is required";
  }

  /* ================= VALIDATION FAIL ================= */
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Validation failed",
      errors,
    };
  }

  /* ================= CATEGORY EXISTENCE CHECK ================= */
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    return {
      success: false,
      message: "Invalid categoryId",
      errors: {
        categoryId: "Category does not exist",
      },
    };
  }

  /* ================= SLUG UNIQUE CHECK ================= */
  const existingSlug = await prisma.machine.findUnique({
    where: { slug: payload.slug },
  });

  if (existingSlug) {
    return {
      success: false,
      message: "Slug already exists",
      errors: {
        slug: "Slug must be unique",
      },
    };
  }

  /* ================= CREATE MACHINE ================= */
  const machine = await prisma.machine.create({
    data: {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      categoryId: payload.categoryId,
      brand: payload.brand,
      model: payload.model,
      features: payload.features,
      techSpecs: payload.techSpecs,
      dynamicButtons: payload.dynamicButtons,
      visibility: payload.visibility ?? true,
    },
  });

  return {
    success: true,
    message: "Machine created successfully",
    data: machine,
  };
};









/* ================= LIST ================= */
// export const getMachineListService = async (query: any) => {
//   const { categoryId, search } = query;

//   return prisma.machine.findMany({
//     where: {
//       visibility: true,
//       categoryId: categoryId || undefined,
//       OR: search
//         ? [
//             { title: { contains: search, mode: "insensitive" } },
//             { slug: { contains: search, mode: "insensitive" } },
//           ]
//         : undefined,
//     },
//     include: {
//       images: true,
//       videos: true,
//       category: true,
//     },
//     orderBy: { createdAt: "desc" },
//   });
// };




export const getMachineListService = async (query: any) => {
  const {
    search,
    categorySlug,
    subCategorySlug,
    brand,
    model,
    visibility,
    hasImage,
    hasVideo,
    automation,
    sortBy,
    order,
    page = 1,
    limit = 10,
  } = query;

  /* ================= WHERE CONDITION (SAFE & OPTIONAL) ================= */
  const where: any = {
    // visibility (only if provided)
    visibility:
      visibility !== undefined
        ? visibility === "true"
        : undefined,

    // brand filter
    brand: brand
      ? { contains: brand, mode: "insensitive" }
      : undefined,

    // model filter
    model: model
      ? { contains: model, mode: "insensitive" }
      : undefined,

    
    OR: search
      ? [
          { title: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
        ]
      : undefined,

    // has image
    images:
      hasImage === "true"
        ? { some: {} }
        : undefined,

    // has video
    videos:
      hasVideo === "true"
        ? { some: {} }
        : undefined,

    // automation (JSON filter)
    features:
      automation !== undefined
        ? {
            path: ["automation"],
            equals: automation === "true",
          }
        : undefined,
  };

  /* ================= CATEGORY / SUBCATEGORY ================= */
  if (subCategorySlug) {
    // exact subcategory
    where.category = {
      slug: subCategorySlug,
    };
  } else if (categorySlug) {
    // parent category + its subcategories
    where.category = {
      OR: [
        { slug: categorySlug },
        { parent: { slug: categorySlug } },
      ],
    };
  }

  /* ================= SORTING (SAFE) ================= */
  const allowedSortFields = ["createdAt", "title"];
  const sortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sortOrder = order === "asc" ? "asc" : "desc";

  /* ================= PAGINATION ================= */
  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.min(Number(limit), 50);

  /* ================= QUERY ================= */
  return prisma.machine.findMany({
    where,
    include: {
      images: true,
      videos: true,
      category: true,
    },
    orderBy: {
      [sortField]: sortOrder,
    },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
  });
};










/* ================= SINGLE ================= */
export const getSingleMachineService = async (id: string) => {
  return prisma.machine.findUnique({
    where: { id },
    include: {
      images: true,
      videos: true,
      category: true,
    },
  });
};

/* ================= UPDATE ================= */
// export const updateMachineService = async (
//   id: string,
//   payload: any
// ) => {
//   return prisma.machine.update({
//     where: { id },
//     data: payload,
//   });
// };







export const updateMachineService = async (
  id: string,
  payload: any
) => {
  /* ================= FIND MACHINE ================= */
  const existingMachine = await prisma.machine.findUnique({
    where: { id },
  });

  if (!existingMachine) {
    return {
      success: false,
      message: "Machine not found",
    };
  }

  const errors: Record<string, string> = {};

  /* ================= EMPTY STRING CHECK ================= */
  if (payload.title !== undefined && payload.title.trim() === "") {
    errors.title = "Title cannot be empty";
  }

  if (payload.slug !== undefined && payload.slug.trim() === "") {
    errors.slug = "Slug cannot be empty";
  }

  if (payload.categoryId !== undefined && payload.categoryId.trim() === "") {
    errors.categoryId = "Category cannot be empty";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Validation failed",
      errors,
    };
  }

  /* ================= SLUG UNIQUE CHECK ================= */
  if (payload.slug) {
    const slugExists = await prisma.machine.findFirst({
      where: {
        slug: payload.slug,
        NOT: { id },
      },
    });

    if (slugExists) {
      return {
        success: false,
        message: "Slug already exists",
        errors: {
          slug: "Slug must be unique",
        },
      };
    }
  }

  /* ================= CATEGORY CHECK ================= */
  if (payload.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!categoryExists) {
      return {
        success: false,
        message: "Invalid categoryId",
        errors: {
          categoryId: "Category does not exist",
        },
      };
    }
  }

  /* ================= UPDATE MACHINE ================= */
  const updatedMachine = await prisma.machine.update({
    where: { id },
    data: payload,
  });

  return {
    success: true,
    message: "Machine updated successfully",
    data: updatedMachine,
  };
};













/* ================= DELETE ================= */
export const deleteMachineService = async (id: string) => {
  return prisma.machine.delete({
    where: { id },
  });
};

/* ================= IMAGE ================= */
export const addMachineImageService = async (
  machineId: string,
  url: string,
  isPrimary = false
) => {
  return prisma.machineImage.create({
    data: {
      machineId,
      url,
      isPrimary,
    },
  });
};

export const deleteMachineImageService = async (id: string) => {
  return prisma.machineImage.delete({
    where: { id },
  });
};

/* ================= VIDEO ================= */
// export const addMachineVideoService = async (
//   machineId: string,
//   url: string
// ) => {
//   return prisma.machineVideo.create({
//     data: {
//       machineId,
//       url,
//     },
//   });
// };


export const addMachineVideoService = async (
  machineId: string,
  url: string
) => {
  // Machine exists?
  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
  });

  if (!machine) {
    return {
      success: false,
      message: "Machine not found",
    };
  }

  // Save video
  const video = await prisma.machineVideo.create({
    data: {
      machineId,
      url,
    },
  });

  return {
    success: true,
    message: "Video added successfully",
    data: video,
  };
};



export const deleteMachineVideoService = async (id: string) => {
  return prisma.machineVideo.delete({
    where: { id },
  });
};
