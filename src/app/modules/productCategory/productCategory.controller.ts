import { Request, Response } from "express";
import { CategoryService } from "./productCategory.service";





const createCategory = async (req: Request, res: Response) => {
  const coverImage = (req.file as any)?.location;

  const payload = {
    ...req.body,
    coverImage,
  };

  const result = await CategoryService.createCategory(payload);

  res.status(201).json({
    success: true,
    data: result,
  });
};




const getAllCategories = async (_req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories();
  res.status(200).json({ success: true, data: result });
};

const updateCategory = async (req: Request, res: Response) => {
  const file = req.file as Express.MulterS3.File | undefined;

  const payload = {
    ...req.body,
    coverImage: file?.location || req.body.coverImage,
  };

  const result = await CategoryService.updateCategory(req.params.id as string, payload);

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: result,
  });
};

const deleteCategory = async (req: Request, res: Response) => {
  const result = await CategoryService.deleteCategory(req.params.id as string);
  res.status(200).json({ success: true,
    
    data: "Category deleted successfully" });
};

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
