import { prisma } from "../../shared/prisma";


class CategoryService {
  async createCategory(payload: any) {
    const exists = await prisma.category.findUnique({
      where: { slug: payload.slug },
    });

    if (exists) {
      throw new Error("Slug must be unique!");
    }

    const category = await prisma.category.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        icon: payload.icon,
        image: payload.image,
        showOnHome: payload.showOnHome ?? false,
        parentId: payload.parentId ?? null,
      },
    });

    return category;
  }


  async getAllCategories () {

    const category = await prisma.category.findMany({
      where:{
        parentId:null
      },
      include:{
        children:true
      },
      orderBy:{
        createdAt:"desc"
      }
    })

    return category;


  }


  async getCategoryById (id:string){

    const category = await prisma.category.findUnique({
      where:{
        id:id
      },
      include:{
        children:true
      }
    })

    return category;

  }


  async updateCategory(id: string, payload: any) {
  const exists = await prisma.category.findUnique({ where: { id } });

  if (!exists) throw new Error("Category not found");


  if (payload.slug) {
    const slugExists = await prisma.category.findFirst({
      where: {
        slug: payload.slug,
        NOT: { id }
      }
    });
    if (slugExists) throw new Error("Slug already taken");
  }

  return await prisma.category.update({
    where: { id },
    data: payload
  });
}


async DeleteCategory (id:string) {
  
  const category = await prisma.category.delete({
    where:{
      id:id
    }
  })

  return category;
}


async createSubCategory (payload:any) {

  const parent = await prisma.category.findUnique({
    where:{
      id:payload.parentId
    
    }
    
  });

  if(!parent){
    throw new Error("Parent category not found");
  }

  const slugExists = await prisma.category.findUnique({
    where:{
      slug:payload.slug
    }
    
  })

  if(slugExists){
    throw new Error("Slug must be unique");
  }

  return await prisma.category.create({
    data:{
      name:payload.name,
      slug:payload.slug,
      description:payload.description,
      image:payload.image,
      icon:payload.icon,
      showOnHome:payload.showOnHome,
      parentId:payload.parentId
    }
  })



}


async getSubCategoryById (id:string) {

  const category = await prisma.category.findMany({
    where:{
      parentId:id
    },
    include:{
     parent:true
    },
    orderBy:{
      createdAt:"desc"
    }
  })

  return category;

}


async updateSubCategory(id: string, payload: any) {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) {
    throw new Error("Subcategory not found");
  }

  // slug unique check (ignore current record)
  if (payload.slug) {
    const slugExists = await prisma.category.findFirst({
      where: {
        slug: payload.slug,
        NOT: { id }
      }
    });
    if (slugExists) throw new Error("Slug already taken");
  }

  // parent category check if parentId changed
  if (payload.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: payload.parentId }
    });
    if (!parent) throw new Error("Parent category not found");
  }

  return await prisma.category.update({
    where: { id },
    data: payload,
  });
}






}

export const categoryService = new CategoryService();
