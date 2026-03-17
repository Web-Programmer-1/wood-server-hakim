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
  if (!payload) {
    throw new Error( "Payload is required");
  }

  const existingCategory = await prisma.productCategory.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new Error("Product category not found");
  }

  const data: any = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.slug !== undefined) data.slug = payload.slug;
  if (payload.coverImage !== undefined) data.coverImage = payload.coverImage;
  if (payload.visibility !== undefined) {
    if (typeof payload.visibility === "string") {
      data.visibility = payload.visibility === "true";
    } else {
      data.visibility = Boolean(payload.visibility);
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error( "No data provided for update");
  }

  return prisma.productCategory.update({
    where: { id },
    data,
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
