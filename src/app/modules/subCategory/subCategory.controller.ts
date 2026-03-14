import { Request, Response } from "express";
import { SubCategoryService } from "./subCategory.service";

const createSubCategory = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.MulterS3.File | undefined;

    const payload = {
      ...req.body,
      thumbnailImage: file?.location || "",
    };

    const result = await SubCategoryService.createSubCategory(payload);

    res.status(201).json({
      success: true,
      message: "SubCategory created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create SubCategory",
    });
  }
};
const getSubCategories = async (_req: Request, res: Response) => {
  try {
    const result = await SubCategoryService.getSubCategories();

    res.status(200).json({
      success: true,
      message: "SubCategories fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch SubCategories",
    });
  }
};

const getSubCategoriesByCategory = async (req: Request, res: Response) => {
  try {
    const { categorySlug } = req.params;
    const result = await SubCategoryService.getSubCategoriesByCategory(
      categorySlug
    );

    res.status(200).json({
      success: true,
      message: "SubCategories fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch SubCategories by category",
    });
  }
};

const getSingleSubCategory = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await SubCategoryService.getSingleSubCategory(slug);

    res.status(200).json({
      success: true,
      message: "SubCategory fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Failed to fetch SubCategory",
    });
  }
};

const updateSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file as Express.MulterS3.File | undefined;

    const payload = {
      ...req.body,
      ...(file?.location && { thumbnailImage: file.location }),
    };

    const result = await SubCategoryService.updateSubCategory(id, payload);

    res.status(200).json({
      success: true,
      message: "SubCategory updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update SubCategory",
    });
  }
};

const deleteSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await SubCategoryService.deleteSubCategory(id);

    res.status(200).json({
      success: true,
      message: "SubCategory deleted successfully",
      data: null,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Failed to delete SubCategory",
    });
  }
};

export const SubCategoryController = {
  createSubCategory,
  getSubCategories,
  getSubCategoriesByCategory,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory,
};


