
import slugify from "slugify";
import { prisma } from "../../shared/prisma";

const createSubCategory = async (payload: {
  name: string;
  thumbnailImage?: string;
  description?: string;
  categoryId: string;
}) => {
  const { name, thumbnailImage, description, categoryId } = payload;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const slug = slugify(name, { lower: true, strict: true });

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { slug },
  });

  if (existingSubCategory) {
    throw new Error("SubCategory slug already exists");
  }

  const result = await prisma.subCategory.create({
    data: {
      name,
      slug,
      thumbnailImage,
      description,
      categoryId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return result;
};

const getSubCategories = async () => {
  const result = await prisma.subCategory.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    // Serial order: first-created first, last-created last (matches the
    // category list so every surface — mega-menu, homepage, catalogue —
    // shows subcategories in the same, stable order).
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
  });

  return result;
};

const getSubCategoriesByCategory = async (categorySlug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const result = await prisma.subCategory.findMany({
    where: { categoryId: category.id },
    // Serial order (oldest subcategory first) to match the flat list.
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnailImage: true,
        },
      },
    },
  });

  return result;
};

const getSingleSubCategory = async (slug: string) => {
  const result = await prisma.subCategory.findUnique({
    where: { slug },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      machines: {
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnailImage: true,
          model: true,
        },
        // Oldest-added first, newest-added last (matches category list).
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" },
        ],
      },
    },
  });

  if (!result) {
    throw new Error("SubCategory not found");
  }

  return result;
};

const updateSubCategory = async (
  id: string,
  payload: {
    name?: string;
    thumbnailImage?: string;
    description?: string;
    categoryId?: string;
  }
) => {
  const existing = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("SubCategory not found");
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  let updatedSlug: string | undefined;

  if (payload.name) {
    updatedSlug = slugify(payload.name, { lower: true, strict: true });

    const slugExists = await prisma.subCategory.findFirst({
      where: {
        slug: updatedSlug,
        NOT: {
          id,
        },
      },
    });

    if (slugExists) {
      throw new Error("SubCategory slug already exists");
    }
  }

  const result = await prisma.subCategory.update({
    where: { id },
    data: {
      name: payload.name,
      thumbnailImage: payload.thumbnailImage,
      description: payload.description,
      categoryId: payload.categoryId,
      ...(updatedSlug && { slug: updatedSlug }),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return result;
};

const deleteSubCategory = async (id: string) => {
  const existing = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("SubCategory not found");
  }

  const result = await prisma.subCategory.delete({
    where: { id },
  });

  return result;
};

export const SubCategoryService = {
  createSubCategory,
  getSubCategories,
  getSubCategoriesByCategory,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory,
};