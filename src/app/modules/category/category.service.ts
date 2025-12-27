import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";
import { ApiError } from "../../errors/ApiError";

const getCategories = async () => {
  return prisma.category.findMany({
    where: {
      parentId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getCategoryTree = async () => {
  return prisma.category.findMany({
    where: {
      parentId: null,
    },
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
  });
};



const getMachinesByCategory = async (slug: string) => {
  if (!slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category slug is required");
  }

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  return prisma.machine.findMany({
    where: {
      categoryId: category.id,
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

const createCategory = async (payload: any) => {
  if (!payload?.name || !payload?.slug) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Category name and slug are required"
    );
  }

  const isExist = await prisma.category.findUnique({
    where: { slug: payload.slug },
  });

  if (isExist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Category with this slug already exists"
    );
  }

  return prisma.category.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      parentId: payload.parentId || null,
    },
  });
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

  return prisma.category.update({
    where: { id },
    data: {
      name: payload.name ?? category.name,
      slug: payload.slug ?? category.slug,
      parentId:
        payload.parentId !== undefined
          ? payload.parentId
          : category.parentId,
    },
  });
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

  return prisma.category.delete({
    where: { id },
  });
};
export const CategoryService = {
  getCategories,
  getCategoryTree,
  getMachinesByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};


















