import { Request, Response } from "express";
import { ProductService } from "./product.service";

// const createProduct = async (req: Request, res: Response) => {
//   const images = (req.files as any[])?.map((file, index) => ({
//     imageUrl: file.location,
//     isPrimary: index === 0,
//     orderIndex: index,
//   }));

//   const payload = {
//     ...req.body,
//     keyPoints: req.body.keyPoints
//       ? JSON.parse(req.body.keyPoints)
//       : null,
//     images,
//   };

//   const result = await ProductService.createProduct(payload);

//   res.status(201).json({
//     success: true,
//     data: result,
//   });
// };







const createProduct = async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.MulterS3.File[];
  };

  const mainImages = (files?.images || []).map((file, index) => ({
    imageUrl: file.location,
    isPrimary: index === 0,
    orderIndex: index,
  }));

  const parsedVariants = req.body.variants
    ? JSON.parse(req.body.variants)
    : [];

  const variantFiles = files?.variantImages || [];

  const variants = parsedVariants.map((variant: any, index: number) => ({
    ...variant,
    imageUrl: variantFiles[index]?.location || null,
  }));

  const payload = {
    ...req.body,
    keyPoints: req.body.keyPoints ? JSON.parse(req.body.keyPoints) : null,
    images: mainImages,
    variants,
  };

  const result = await ProductService.createProduct(payload);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
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



// const updateProduct = async (req: Request, res: Response) => {
//   const images = (req.files as any[])?.map((file, index) => ({
//     imageUrl: file.location,
//     isPrimary: index === 0,
//     orderIndex: index,
//   }));

//   const payload = {
//     ...req.body,
//     images,
//   };

//   const result = await ProductService.updateProduct(
//     req.params.id,
//     payload
//   );

//   res.status(200).json({
//     success: true,
//     data: result,
//   });
// };




const updateProduct = async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.MulterS3.File[];
  };

  const mainImages = (files?.images || []).map((file, index) => ({
    imageUrl: file.location,
    isPrimary: index === 0,
    orderIndex: index,
  }));

  let parsedVariants: any[] = [];
  let parsedKeyPoints: any = undefined;

  try {
    parsedVariants = req.body.variants ? JSON.parse(req.body.variants) : [];
  } catch (error) {
    throw new Error("Invalid JSON format in variants");
  }

  try {
    parsedKeyPoints =
      req.body.keyPoints !== undefined
        ? req.body.keyPoints
          ? JSON.parse(req.body.keyPoints)
          : null
        : undefined;
  } catch (error) {
    throw new Error("Invalid JSON format in keyPoints");
  }

  const variantFiles = files?.variantImages || [];

  const variants = parsedVariants.map((variant: any, index: number) => ({
    ...variant,
    imageUrl: variantFiles[index]?.location || variant.imageUrl || null,
  }));

  const payload = {
    ...req.body,
    keyPoints: parsedKeyPoints,
    images: mainImages.length > 0 ? mainImages : undefined,
    variants: req.body.variants !== undefined ? variants : undefined,
  };

  const result = await ProductService.updateProduct(req.params.id, payload);

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
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
