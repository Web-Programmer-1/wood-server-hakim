import { prisma } from "../../shared/prisma";



const createCategory = async (payload: any) => {
  if (!payload.name || !payload.slug) {
    throw new Error("Name and slug are required");
  }

  return prisma.productCategory.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      coverImage: payload.coverImage, 
    },
  });
};




const getAllCategories = async () => {
  return prisma.productCategory.findMany({
    where: { visibility: true },
    orderBy: { createdAt: "asc" },
  });
};

const updateCategory = async (id: string, payload: any) => {
  return prisma.productCategory.update({
    where: { id },
    data: {
      name: payload.name,
      slug: payload.slug,
      coverImage: payload.coverImage,
      visibility: payload.visibility,
    },
  });
};

const deleteCategory = async (id: string) => {
  return prisma.productCategory.update({
    where: { id },
    data: { visibility: false },
  });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
