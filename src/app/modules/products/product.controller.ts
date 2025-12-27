import { Request, Response } from "express";
import { ProductService } from "./product.service";

const createProduct = async (req: Request, res: Response) => {
  const images = (req.files as any[])?.map((file, index) => ({
    imageUrl: file.location,
    isPrimary: index === 0, // first image primary
    orderIndex: index,
  }));

  const payload = {
    ...req.body,
    images,
  };

  const result = await ProductService.createProduct(payload);

  res.status(201).json({
    success: true,
    data: result,
  });
};

const getAllProducts = async (req: Request, res: Response) => {
  const result = await ProductService.getAllProducts(req.query);

  res.status(200).json({
    success: true,
    meta: result.meta,
    data: result.data,
  });
};





const getProductDetails = async (req: Request, res: Response) => {
  const result = await ProductService.getProductDetails(req.params.slug);

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getRelatedProducts = async (req: Request, res: Response) => {
  const result = await ProductService.getRelatedProducts(req.params.slug);

  res.status(200).json({
    success: true,
    data: result,
  });
};



const updateProduct = async (req: Request, res: Response) => {
  const images = (req.files as any[])?.map((file, index) => ({
    imageUrl: file.location,
    isPrimary: index === 0,
    orderIndex: index,
  }));

  const payload = {
    ...req.body,
    images,
  };

  const result = await ProductService.updateProduct(
    req.params.id,
    payload
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

const deleteProduct = async (req: Request, res: Response) => {
  await ProductService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
};





export const ProductController = {
  createProduct,
  getAllProducts,
  getProductDetails,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
};
