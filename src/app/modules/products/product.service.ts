import {
  AvailabilityStatus,
  BrandType,
  Prisma,
  ProductType,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { PRODUCT_LIST_SELECT } from "./product.interface";



// const createProduct = async (payload: any) => {
//   const {
//     name,
//     slug,
//     basePrice,
//     discountPrice,
//     availability,
//     brandType,
//     productCategoryId,
//     description,
//     shortDescription,
//     productType,
//     images,
//     keyPoints,
//     stockQuantity,
//     damagedQty,
//     reorderLevel,
//     reservedQty,
//     visibility,

//   } = payload;

//   if (
//     !name ||
//     !slug ||
//     !basePrice ||
//     !availability ||
//     !brandType ||
//     !productCategoryId
//   ) {
//     throw new Error("Missing required product fields");
//   }

//   const base = Number(basePrice);
//   const discount = discountPrice ? Number(discountPrice) : null;

//   const discountPercent =
//     discount && discount < base
//       ? Math.round(((base - discount) / base) * 100)
//       : null;

//   const product = await prisma.product.create({
//     data: {
//       name,
//       slug,
//       basePrice: base,
//       discountPrice: discount,
//       discountPercent,
//       availability: availability as AvailabilityStatus,
//       brandType: brandType as BrandType,
//       productType: productType ? (productType as ProductType) : null,
//       description,
//       shortDescription,
//       productCategoryId,
//       keyPoints,

//       stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
//       damagedQty: damagedQty ? Number(damagedQty) : 0,
//       reorderLevel: reorderLevel ? Number(reorderLevel) : 5,
//       reservedQty: reservedQty ? Number(reservedQty) : 0,
//       visibility:
//         visibility !== undefined
//           ? visibility === "true" || visibility === true
//           : true,
//       images: {
//         create: images || [],
//       },
//     },
//     include: {
//       images: true,
//       productCategory: true,
//     },
//   });

//   return {
//     ...product,

//   };
// };

const createProduct = async (payload: any) => {
  const {
    name,
    slug,
    basePrice,
    discountPrice,
    availability,
    brandType,
    productCategoryId,
    description,
    shortDescription,
    productType,
    images,
    keyPoints,
    stockQuantity,
    damagedQty,
    reorderLevel,
    reservedQty,
    visibility,
    variants,
  } = payload;

  if (
    !name ||
    !slug ||
    !basePrice ||
    !availability ||
    !brandType ||
    !productCategoryId
  ) {
    throw new Error("Missing required product fields");
  }

  const base = Number(basePrice);
  const discount = discountPrice ? Number(discountPrice) : null;

  const discountPercent =
    discount && discount < base
      ? Math.round(((base - discount) / base) * 100)
      : null;

  const parsedVariants = Array.isArray(variants) ? variants : [];

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      basePrice: base,
      discountPrice: discount,
      discountPercent,
      availability: availability as AvailabilityStatus,
      brandType: brandType as BrandType,
      productType: productType ? (productType as ProductType) : null,
      description,
      shortDescription,
      productCategoryId,
      keyPoints,

      stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
      damagedQty: damagedQty ? Number(damagedQty) : 0,
      reorderLevel: reorderLevel ? Number(reorderLevel) : 5,
      reservedQty: reservedQty ? Number(reservedQty) : 0,
      visibility:
        visibility !== undefined
          ? visibility === "true" || visibility === true
          : true,

      images: {
        create: images || [],
      },

      variants: {
        create: parsedVariants.map((variant: any) => ({
          label: variant.label || null,
          workingWidthMm: Number(variant.workingWidthMm),
          workingLengthMm: Number(variant.workingLengthMm),
          price: Number(variant.price),
          discountPrice: variant.discountPrice
            ? Number(variant.discountPrice)
            : null,
          imageUrl: variant.imageUrl || null,
          stockQuantity: variant.stockQuantity
            ? Number(variant.stockQuantity)
            : 0,
          isDefault: variant.isDefault === true || variant.isDefault === "true",
        })),
      },
    },
    include: {
      images: true,
      productCategory: true,
      variants: true,
    },
  });

  return product;
};

// const getAllProducts = async (query: Record<string, any>) => {
//   const page = Number(query.page) || 1;
//   const limit = Number(query.limit) || 10;
//   const skip = (page - 1) * limit;

//   const {
//     searchTerm,
//     slug,
//     name,
//     brandType,
//     productType,
//     availability,
//     categorySlug,
//     minPrice,
//     maxPrice,
//     visibility,
//     minWidthMm,
//     maxWidthMm,
//     minLengthMm,
//     maxLengthMm,
//     sizePreset,
//   } = query;

//   const andConditions: Prisma.ProductWhereInput[] = [];

//   // ✅ unified search (name + slug)
//   if (searchTerm || name || slug) {
//     const searchValue = searchTerm || name || slug;

//     andConditions.push({
//       OR: [
//         {
//           name: {
//             contains: searchValue,
//             mode: "insensitive",
//           },
//         },
//         {
//           slug: {
//             contains: searchValue,
//             mode: "insensitive",
//           },
//         },
//       ],
//     });
//   }

//   // ✅ filters
//   if (brandType) {
//     andConditions.push({
//       brandType: brandType as BrandType,
//     });
//   }

//   if (productType) {
//     andConditions.push({
//       productType: productType as ProductType,
//     });
//   }

//   if (availability) {
//     andConditions.push({
//       availability: availability as AvailabilityStatus,
//     });
//   }

//   if (categorySlug) {
//     andConditions.push({
//       productCategory: {
//         slug: {
//           equals: String(categorySlug),
//           mode: "insensitive",
//         },
//       },
//     });
//   }



//   if (visibility !== undefined) {
//     andConditions.push({
//       visibility: visibility === "true" || visibility === true,
//     });
//   }

//   if (minPrice || maxPrice) {
//     andConditions.push({
//       basePrice: {
//         gte: minPrice ? Number(minPrice) : undefined,
//         lte: maxPrice ? Number(maxPrice) : undefined,
//       },
//     });
//   }

//   const whereCondition: Prisma.ProductWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const data = await prisma.product.findMany({
//     where: whereCondition,
//     skip,
//     take: limit,
//     orderBy: {
//       createdAt: "desc",
//     },
//     include: {
//       images: true,
//       productCategory: true,
//     },
//   });

//   const total = await prisma.product.count({
//     where: whereCondition,
//   });

//   const formattedData = data.map((product) => ({
//     ...product,
//   }));

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//       totalPage: Math.ceil(total / limit),
//     },
//     data: formattedData,
//   };
// };







// const getAllProducts = async (query: Record<string, any>) => {
//   const page = Math.max(1, Number(query.page) || 1);
//   const limit = Math.min(100, Math.max(1, Number(query.limit) || 10)); // ✅ max 100 enforce
//   const skip = (page - 1) * limit;

//   // ✅ Optional includes — শুধু request করলেই load হবে
//   const includeImages = query.include === "images" || query.include === "all";
//   const includeCategory = query.include === "category" || query.include === "all";

//   const {
//     searchTerm,
//     slug,
//     name,
//     brandType,
//     productType,
//     availability,
//     categorySlug,
//     minPrice,
//     maxPrice,
//     visibility,
//   } = query;

//   const andConditions: Prisma.ProductWhereInput[] = [];

//   // ✅ Visibility default: শুধু visible products দেখাও (unless admin)
//   if (visibility !== undefined) {
//     andConditions.push({
//       visibility: visibility === "true" || visibility === true,
//     });
//   } else {
//     andConditions.push({ visibility: true }); // default: only visible
//   }

//   // ✅ Search
//   if (searchTerm || name || slug) {
//     const searchValue = (searchTerm || name || slug) as string;
//     andConditions.push({
//       OR: [
//         { name: { contains: searchValue, mode: "insensitive" } },
//         { slug: { contains: searchValue, mode: "insensitive" } },
//       ],
//     });
//   }

//   if (brandType) andConditions.push({ brandType: brandType as BrandType });
//   if (productType) andConditions.push({ productType: productType as ProductType });
//   if (availability) andConditions.push({ availability: availability as AvailabilityStatus });

//   if (categorySlug) {
//     andConditions.push({
//       productCategory: {
//         slug: { equals: String(categorySlug), mode: "insensitive" },
//       },
//     });
//   }

//   if (minPrice || maxPrice) {
//     andConditions.push({
//       basePrice: {
//         gte: minPrice ? Number(minPrice) : undefined,
//         lte: maxPrice ? Number(maxPrice) : undefined,
//       },
//     });
//   }

//   const whereCondition: Prisma.ProductWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   // ✅ Core fix: $transaction দিয়ে দুইটা query একসাথে parallel এ চালাও
//   const [data, total] = await prisma.$transaction([
//     prisma.product.findMany({
//       where: whereCondition,
//       skip,
//       take: limit,
//       orderBy: { createdAt: "desc" },
//       // ✅ শুধু দরকারি fields select করো
//       select: {
//         ...PRODUCT_LIST_SELECT,
//         // ✅ Conditional includes — query param ছাড়া relation load হবে না
//         ...(includeImages && {
//           images: {
//             where: { isPrimary: true }, // শুধু primary image, সব না
//             select: { imageUrl: true, isPrimary: true },
//             take: 1,
//           },
//         }),
//         ...(includeCategory && {
//           productCategory: {
//             select: { id: true, name: true, slug: true },
//           },
//         }),
//       },
//     }),
//     // count() ও একই where — same transaction এ
//     prisma.product.count({ where: whereCondition }),
//   ]);

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//       totalPage: Math.ceil(total / limit),
//     },
//     data,
//   };
// };







// ✅ Full updated service function
const getAllProducts = async (query: Record<string, any>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const {
    searchTerm,
    slug,
    name,
    brandType,
    productType,
    availability,
    categorySlug,
    minPrice,
    maxPrice,
    visibility,
    minWidthMm,   
    maxWidthMm,   
    minLengthMm,  
    maxLengthMm,  
  } = query;

  const andConditions: Prisma.ProductWhereInput[] = [];

  if (visibility !== undefined) {
    andConditions.push({
      visibility: visibility === "true" || visibility === true,
    });
  } else {
    andConditions.push({ visibility: true });
  }

  if (searchTerm || name || slug) {
    const searchValue = (searchTerm || name || slug) as string;
    andConditions.push({
      OR: [
        { name: { contains: searchValue, mode: "insensitive" } },
        { slug: { contains: searchValue, mode: "insensitive" } },
      ],
    });
  }

  if (brandType) andConditions.push({ brandType: brandType as BrandType });
  if (productType) andConditions.push({ productType: productType as ProductType });
  if (availability) andConditions.push({ availability: availability as AvailabilityStatus });

  if (categorySlug) {
    andConditions.push({
      productCategory: {
        slug: { equals: String(categorySlug), mode: "insensitive" },
      },
    });
  }

  if (minPrice || maxPrice) {
    andConditions.push({
      basePrice: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
    });
  }

  // ✅ Size filter — variant এর width/length range দিয়ে product filter
  const hasSizeFilter = minWidthMm || maxWidthMm || minLengthMm || maxLengthMm;
  if (hasSizeFilter) {
    andConditions.push({
      variants: {
        some: {
          ...(minWidthMm || maxWidthMm
            ? {
                workingWidthMm: {
                  gte: minWidthMm ? Number(minWidthMm) : undefined,
                  lte: maxWidthMm ? Number(maxWidthMm) : undefined,
                },
              }
            : {}),
          ...(minLengthMm || maxLengthMm
            ? {
                workingLengthMm: {
                  gte: minLengthMm ? Number(minLengthMm) : undefined,
                  lte: maxLengthMm ? Number(maxLengthMm) : undefined,
                },
              }
            : {}),
        },
      },
    });
  }

  const whereCondition: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ✅ Variant filter condition — response এ শুধু matching variants
  const variantWhereCondition: Prisma.ProductVariantWhereInput = hasSizeFilter
    ? {
        ...(minWidthMm || maxWidthMm
          ? {
              workingWidthMm: {
                gte: minWidthMm ? Number(minWidthMm) : undefined,
                lte: maxWidthMm ? Number(maxWidthMm) : undefined,
              },
            }
          : {}),
        ...(minLengthMm || maxLengthMm
          ? {
              workingLengthMm: {
                gte: minLengthMm ? Number(minLengthMm) : undefined,
                lte: maxLengthMm ? Number(maxLengthMm) : undefined,
              },
            }
          : {}),
      }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        ...PRODUCT_LIST_SELECT,
        images: {
          select: {
            id: true,
            productId: true,
            imageUrl: true,
            isPrimary: true,
            orderIndex: true,
            createdAt: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        productCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverImage: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        // ✅ Matching variants — size filter থাকলে filtered, না থাকলে সব
        variants: {
          where: variantWhereCondition,
          select: {
            id: true,
            label: true,
            workingWidthMm: true,
            workingLengthMm: true,
            price: true,
            discountPrice: true,
            imageUrl: true,
            stockQuantity: true,
            isDefault: true,
          },
          orderBy: { workingWidthMm: "asc" },
        },
      },
    }),
    prisma.product.count({ where: whereCondition }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data,
  };
};




const getProductDetails = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { orderIndex: "asc" },
      },
      productCategory: true,
      variants: {
        orderBy: { createdAt: "asc" },
    
      },
    },
  });

  if (!product || !product.visibility) {
    throw new Error("Product not found");
  }

  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ||
    product.variants[0] ||
    null;

  const effectivePrice =
    defaultVariant?.discountPrice ??
    defaultVariant?.price ??
    product.discountPrice ??
    product.basePrice;

  const discountPercent =
    defaultVariant?.discountPrice && defaultVariant.price
      ? Math.round(
          ((defaultVariant.price - defaultVariant.discountPrice) /
            defaultVariant.price) *
            100
        )
      : product.discountPrice
      ? Math.round(
          ((product.basePrice - product.discountPrice) / product.basePrice) * 100
        )
      : null;

  const machineSize = defaultVariant
    ? `${defaultVariant.workingWidthMm} × ${defaultVariant.workingLengthMm} mm`
    : null;

  return {
    ...product,
    defaultVariant,
    effectivePrice,
    discountPercent,
    machineSize,
  };
};

const getRelatedProducts = async (slug: string) => {
  const current = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, productCategoryId: true },
  });

  if (!current) {
    throw new Error("Product not found");
  }

  return prisma.product.findMany({
    where: {
      visibility: true,
      productCategoryId: current.productCategoryId,
      NOT: { id: current.id },
    },
    include: {
      images: {
        where: { isPrimary: true },
      },
    },
    take: 6,
  });
};



const updateProduct = async (id: string, payload: any) => {
  const {
    name,
    slug,
    basePrice,
    discountPrice,
    availability,
    brandType,
    productType,
    productCategoryId,
    shortDescription,
    description,
    images,
    variants,
  } = payload;

  // 🔹 update main product
  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      basePrice: basePrice ? Number(basePrice) : undefined,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      availability,
      brandType,
      productType,
      productCategoryId,
      shortDescription,
      description,
    },
  });

  // 🔹 replace images
  if (images && images.length > 0) {
    await prisma.productImage.deleteMany({
      where: { productId: id },
    });

    await prisma.productImage.createMany({
      data: images.map((img: any) => ({
        ...img,
        productId: id,
      })),
    });
  }

  // 🔥 🔥 🔥 VARIANT UPDATE START

  const parsedVariants = Array.isArray(variants)
    ? variants
    : variants
    ? JSON.parse(variants)
    : [];

  if (parsedVariants.length) {
    // delete old variants
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    });

    // create new variants
    await prisma.productVariant.createMany({
      data: parsedVariants.map((variant: any) => ({
        productId: id,
        label: variant.label || null,
        workingWidthMm: Number(variant.workingWidthMm),
        workingLengthMm: Number(variant.workingLengthMm),
        price: Number(variant.price),
        discountPrice: variant.discountPrice
          ? Number(variant.discountPrice)
          : null,
        imageUrl: variant.imageUrl || null,
        stockQuantity: variant.stockQuantity
          ? Number(variant.stockQuantity)
          : 0,
        isDefault:
          variant.isDefault === true || variant.isDefault === "true",
      })),
    });
  }

  // 🔹 return updated full product
  const updatedProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      productCategory: true,
      variants: true,
    },
  });

  return updatedProduct;
};





const deleteProduct = async (id: string) => {
  return prisma.product.update({
    where: { id },
    data: {
      visibility: false,
    },
  });
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getProductDetails,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
};
