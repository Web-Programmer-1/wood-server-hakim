import { Request, Response } from "express";
import { categoryService } from "./category.service";


export class CategoryController {



  async createCategory(req:Request, res: Response) {
  try {
    let imageUrl = null;
    let iconUrl = null;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files?.image) {
      imageUrl = (files.image[0] as any).location;
    }

    if (files?.icon) {
      iconUrl = (files.icon[0] as any).location;
    }

    const body = {
      ...req.body,
      image: imageUrl,
      icon: iconUrl,
      showOnHome: req.body.showOnHome === "true",
    };


    const result = await categoryService.createCategory(body);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async getAllCategoriesController (req: Request, res: Response) {

try {

  const category = await categoryService.getAllCategories();

  return res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: category,
  });


  
} catch (error) {
  return res.status(400).json({
    success: false,
    message: (error as Error).message,
  });
  
}

}

async getCategoryByIdCon (req: Request, res: Response){

  try {

    const {id} = req.params;
    const category = await categoryService.getCategoryById(id);

    return res.status(200).json({
      success: true,
      message: "Single Category fetched successfully",
      data: category,
    });
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
    
  }



}


async updateCategory(req:Request, res:Response) {
  try {
    const id = req.params.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let imageUrl = (files?.image?.[0] as any)?.location || null;
    let iconUrl  = (files?.icon?.[0] as any)?.location || null;

    const body = {
      ...req.body,
      showOnHome: req.body.showOnHome === "true",
    };

    if (imageUrl) body.image = imageUrl;
    if (iconUrl)  body.icon = iconUrl;

    const updated = await categoryService.updateCategory(id, body);

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updated
    });

  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}


async deleteCategoryCon (req:Request, res:Response) {
  
  try {
    const id = req.params.id;
    const category = await categoryService.DeleteCategory(id);
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
}


async createSubCategoryCon(req:Request, res:Response) {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const imageUrl = (files?.image?.[0] as any)?.location || null;
    const iconUrl  = (files?.icon?.[0] as any)?.location || null;

    const body = {
      ...req.body,
      image: imageUrl,
      icon: iconUrl,
      showOnHome: req.body.showOnHome === "true",
    };

    const result = await categoryService.createSubCategory(body);

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}


async getSubCategoryByIdCon(req:Request, res:Response){

 try {
    const {id} = req.params;
  const category = await categoryService.getSubCategoryById(id);

  return res.status(200).json({
    status: true,
    message: "Subcategory fetched successfully",
    data: category
  })

 } catch (error:any) {
  return res.status(500).json({
    status: false,
    message: error.message
  })
  
 }

}


async updateSubCategoryCon(req:Request, res:Response) {
  try {
    const id = req.params.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const imageUrl = (files?.image?.[0] as any)?.location || null;
    const iconUrl  = (files?.icon?.[0] as any)?.location || null;

    const body: any = {
      ...req.body,
      showOnHome: req.body.showOnHome === "true",
    };

    if (imageUrl) body.image = imageUrl;
    if (iconUrl)  body.icon = iconUrl;

    const updated = await categoryService.updateSubCategory(id, body);

    res.json({
      success: true,
      message: "Subcategory updated successfully",
      data: updated,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}




}

export const categoryController = new CategoryController();
