import { Request, Response } from "express";
import httpStatus from "http-status";
import { CategoryService } from "./category.service";

const getCategories = async (req: Request, res: Response) => {
  const result = await CategoryService.getCategories();
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const getCategoryTree = async (req: Request, res: Response) => {
  const result = await CategoryService.getCategoryTree();
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const getMachinesByCategory = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await CategoryService.getMachinesByCategory(slug);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const createCategory = async (req: Request, res: Response) => {
  const file = req.file as Express.MulterS3.File;

  const payload = {
    ...req.body,
    thumbnailImage: file?.location || null,
  };

  const result = await CategoryService.createCategory(payload);

  res.status(httpStatus.CREATED).json({
    success: true,
    data: result,
  });
};

const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.updateCategory(id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id);
  res.status(httpStatus.OK).json({
    success: true,
    message:"Category deleted successfully",
    data: result,
  });
};

export const CategoryController = {
  getCategories,
  getCategoryTree,
  getMachinesByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
