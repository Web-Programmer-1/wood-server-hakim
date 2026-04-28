import { Request, Response } from "express";
import { ProductService } from "./product.service";

function parseBodyJsonArray<T>(raw: unknown): T[] {
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mergeVariantUploads(
  parsedVariants: any[],
  variantFiles: Express.MulterS3.File[] = []
) {
  let fileIdx = 0;
  return parsedVariants.map((variant: any) => {
    const { hasNewImage, ...rest } = variant;
    const needNew =
      hasNewImage === true || hasNewImage === "true";
    const imageUrl = needNew
      ? variantFiles[fileIdx++]?.location ?? rest.imageUrl ?? null
      : rest.imageUrl ?? null;
    return { ...rest, imageUrl };
  });
}

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

  const parsedVariants = parseBodyJsonArray(req.body.variants);

  const variantFiles = files?.variantImages || [];

  const variants = mergeVariantUploads(parsedVariants, variantFiles);

  const payload = {
    ...req.body,
    keyPoints: req.body.keyPoints
      ? typeof req.body.keyPoints === "string"
        ? JSON.parse(req.body.keyPoints)
        : req.body.keyPoints
      : null,
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





const getAllProductBrands = async (_req: Request, res: Response) => {
  const result = await ProductService.getAllProductBrands();

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getProductDetails = async (req: Request, res: Response) => {
  const result = await ProductService.getProductDetails(req.params.slug as string);

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getRelatedProducts = async (req: Request, res: Response) => {
  const result = await ProductService.getRelatedProducts(req.params.slug as string);

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

  const parsedVariants = parseBodyJsonArray(req.body.variants);

  let parsedKeyPoints: any = undefined;
  if (req.body.keyPoints !== undefined) {
    const kp = req.body.keyPoints;
    if (kp === null || kp === "") {
      parsedKeyPoints = null;
    } else if (typeof kp === "string") {
      try {
        parsedKeyPoints = JSON.parse(kp);
      } catch {
        throw new Error("Invalid JSON format in keyPoints");
      }
    } else {
      parsedKeyPoints = kp;
    }
  }

  const variantFiles = files?.variantImages || [];

  const variants = mergeVariantUploads(parsedVariants, variantFiles);

  const payload = {
    ...req.body,
    keyPoints: parsedKeyPoints,
    images: mainImages.length > 0 ? mainImages : undefined,
    variants: req.body.variants !== undefined ? variants : undefined,
  };

  const result = await ProductService.updateProduct(req.params.id as string, payload);

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: result,
  });
};






const deleteProduct = async (req: Request, res: Response) => {
  await ProductService.deleteProduct(req.params.id as string);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
};





export const ProductController = {
  createProduct,
  getAllProducts,
  getAllProductBrands,
  getProductDetails,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
};
