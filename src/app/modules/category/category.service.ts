import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";
import { ApiError } from "../../errors/ApiError";
import {
  cacheGetOrSet,
  stableQueryHash,
  CacheTTL,
  invalidateCategoryReadCaches,
  invalidateMachineReadCaches,
} from "../../../utils/httpCache";

const bumpCategoryAndMachineCaches = () =>
  Promise.all([
    invalidateCategoryReadCaches(),
    invalidateMachineReadCaches(),
  ]).catch(() => undefined);

const getCategoriesUncached = async () => {
  return prisma.category.findMany({
    where: {
      parentId: null,
    },


    
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getCategories = async () => {
  return cacheGetOrSet(
    "cache:category:list",
    CacheTTL.categoryList,
    getCategoriesUncached
  );
};

const getCategoryTreeUncached = async () => {
  return prisma.category.findMany({
    where: {
      parentId: null,
    },
    include: {
      machines: {
        orderBy: {
          createdAt: "desc",
        },
      },
      children: {
        include: {
          machines: {
            orderBy: {
              createdAt: "desc",
            },
          },
          children: {
            include: {
              machines: {
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getCategoryTree = async () => {
  return cacheGetOrSet(
    "cache:category:tree",
    CacheTTL.categoryTree,
    getCategoryTreeUncached
  );
};



const getMachinesByCategoryUncached = async (
  slug: string,
  options?: { search?: string; page?: number; limit?: number }
) => {
  if (!slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category slug is required");
  }

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options?.limit) || 9));
  const skip = (page - 1) * limit;
  const trimmedSearch = options?.search?.trim();

  const whereClause = {
    categoryId: category.id,
    isActive: true,
    ...(trimmedSearch
      ? {
          OR: [
            {
              name: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              slug: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.machine.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        thumbnailImage: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.machine.count({
      where: whereClause,
    }),
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

const getMachinesByCategory = async (
  slug: string,
  options?: { search?: string; page?: number; limit?: number }
) => {
  const key = `cache:category:machines:${slug}:${stableQueryHash(
    (options ?? {}) as Record<string, unknown>
  )}`;
  return cacheGetOrSet(key, CacheTTL.categoryMachines, () =>
    getMachinesByCategoryUncached(slug, options)
  );
};

const createCategory = async (payload: any) => {
  if (!payload?.name || !payload?.slug) {
    throw new Error(
      
      "Category name and slug are required"
    );
  }

  const isExist = await prisma.category.findUnique({
    where: { slug: payload.slug },
  });

  if (isExist) {
    throw new Error(
     
      "Category with this slug already exists"
    );
  }

  const created = await prisma.category.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description || null,
      parentId: payload.parentId || null,
      thumbnailImage: payload.thumbnailImage || null,
    },
  });

  await bumpCategoryAndMachineCaches();

  return created;
};

const updateCategory = async (id: string, payload: any) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category id is required");
  }

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  if (payload.slug && payload.slug !== category.slug) {
    const slugExist = await prisma.category.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExist) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Category slug already in use"
      );
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: payload.name ?? category.name,
      slug: payload.slug ?? category.slug,
      description: payload.description ?? category.description,
        parentId:null,
    },
  });

  await bumpCategoryAndMachineCaches();

  return updated;
};

const deleteCategory = async (id: string) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category id is required");
  }

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  const hasMachines = await prisma.machine.findFirst({
    where: {
      categoryId: id,
    },
  });

  if (hasMachines) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete category with existing machines"
    );
  }

  const hasChildren = await prisma.category.findFirst({
    where: {
      parentId: id,
    },
  });

  if (hasChildren) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete category with existing child categories"
    );
  }

  const removed = await prisma.category.delete({
    where: { id },
  });

  await bumpCategoryAndMachineCaches();

  return removed;
};
export const CategoryService = {
  getCategories,
  getCategoryTree,
  getMachinesByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};


















