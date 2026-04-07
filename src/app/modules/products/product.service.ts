import {
  AvailabilityStatus,

  Prisma,
  ProductType,
  SizeUnit,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { PRODUCT_LIST_SELECT } from "./product.interface";
import {
  cacheGetOrSet,
  stableQueryHash,
  CacheTTL,
  invalidateProductReadCaches,
} from "../../../utils/httpCache";



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
    productCategoryId,
    description,
    shortDescription,
    productType,
    brand,
    images,
    keyPoints,
    stockQuantity,
    damagedQty,
    reorderLevel,
    reservedQty,
    visibility,
    variants,
  } = payload;

  // ✅ required field check
  if (
    !name ||
    !slug ||
    !basePrice ||
    !availability ||
    !productCategoryId
  ) {
    throw new Error("Missing required product fields");
  }

  // ✅ category exists check (VERY IMPORTANT)
  const category = await prisma.productCategory.findUnique({
    where: { id: productCategoryId },
  });

  if (!category) {
    throw new Error("Product category not found");
  }

  const base = Number(basePrice);
  const discount =
    discountPrice !== undefined && discountPrice !== null && discountPrice !== ""
      ? Number(discountPrice)
      : null;

  const discountPercent =
    discount && discount < base
      ? Math.round(((base - discount) / base) * 100)
      : null;

  const parsedVariants = Array.isArray(variants) ? variants : [];

  // ✅ variant validation
  parsedVariants.forEach((variant: any, index: number) => {
    if (!variant.customSize) {
      throw new Error(`Variant ${index + 1}: customSize is required`);
    }
    if (!variant.sizeUnit) {
      throw new Error(`Variant ${index + 1}: sizeUnit is required (MM or FT)`);
    }
    if (!variant.price) {
      throw new Error(`Variant ${index + 1}: price is required`);
    }
  });

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      basePrice: base,
      discountPrice: discount,
      discountPercent,
      availability: availability as AvailabilityStatus,
      brand: brand || null,
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

      // ✅ images
      images: {
        create: images || [],
      },

      // ✅ variants (UPDATED)
      variants: {
        create: parsedVariants.map((variant: any) => ({
          customSize: variant.customSize,
          sizeUnit: variant.sizeUnit as SizeUnit,
          price: Number(variant.price),
          discountPrice:
            variant.discountPrice !== undefined &&
            variant.discountPrice !== null &&
            variant.discountPrice !== ""
              ? Number(variant.discountPrice)
              : null,
          imageUrl: variant.imageUrl || null,
          stockQuantity:
            variant.stockQuantity !== undefined &&
            variant.stockQuantity !== null &&
            variant.stockQuantity !== ""
              ? Number(variant.stockQuantity)
              : 0,
          isDefault:
            variant.isDefault === true || variant.isDefault === "true",
        })),
      },
    },
    include: {
      images: {
        orderBy: { orderIndex: "asc" },
      },
      productCategory: true,
      variants: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  await invalidateProductReadCaches().catch(() => undefined);

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
const getAllProductsUncached = async (query: Record<string, any>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const {
    searchTerm,
    slug,
    name,
    brand, // ✅ FIXED
    productType,
    availability,
    category,
    categorySlug: categorySlugLegacy,
    minPrice,
    maxPrice,
    visibility,
    customSize,
    size,
    sizeUnit, // 🔥 NEW
  } = query;

  const effectiveCategorySlug = categorySlugLegacy ?? category;

  const andConditions: Prisma.ProductWhereInput[] = [];

  // visibility
  if (visibility !== undefined) {
    andConditions.push({
      visibility: visibility === "true" || visibility === true,
    });
  } else {
    andConditions.push({ visibility: true });
  }

  // search (name/slug/brand/category/variant size label)
  const normalizedSearch = String(searchTerm ?? name ?? slug ?? "").trim();
  if (normalizedSearch) {
    const possibleSizeUnit = ["MM", "FT"].includes(normalizedSearch.toUpperCase())
      ? (normalizedSearch.toUpperCase() as SizeUnit)
      : null;

    andConditions.push({
      OR: [
        { name: { contains: normalizedSearch, mode: "insensitive" } },
        { slug: { contains: normalizedSearch, mode: "insensitive" } },
        { brand: { contains: normalizedSearch, mode: "insensitive" } },
        {
          productCategory: {
            slug: { contains: normalizedSearch, mode: "insensitive" },
          },
        },
        {
          productCategory: {
            name: { contains: normalizedSearch, mode: "insensitive" },
          },
        },
        {
          variants: {
            some: {
              customSize: { contains: normalizedSearch, mode: "insensitive" },
            },
          },
        },
        ...(possibleSizeUnit
          ? [
              {
                variants: {
                  some: {
                    sizeUnit: possibleSizeUnit,
                  },
                },
              } as any,
            ]
          : []),
      ],
    });
  }

  // brand filter
  if (brand) {
    const brandTerms = String(brand)
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    if (brandTerms.length > 0) {
      andConditions.push({
        OR: brandTerms.map((term) => ({
          brand: { contains: term, mode: "insensitive" },
        })),
      });
    }
  }

  // product type
  if (productType) {
    andConditions.push({
      productType: productType as ProductType,
    });
  }

  // availability
  if (availability) {
    const availabilityTerms = String(availability)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (availabilityTerms.length > 0) {
      andConditions.push({
        OR: availabilityTerms.map((term) => ({
          availability: term as AvailabilityStatus,
        })),
      });
    }
  }

  // category
  if (effectiveCategorySlug) {
    andConditions.push({
      productCategory: {
        slug: {
          equals: String(effectiveCategorySlug),
          mode: "insensitive",
        },
      },
    });
  }

  // price
  if (minPrice || maxPrice) {
    andConditions.push({
      basePrice: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
    });
  }

  // 🔥 size filter (customSize + sizeUnit)
  const sizeValue = customSize || size;
  const sizeUnitTerms = sizeUnit
    ? String(sizeUnit)
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean)
    : [];

  const hasSizeFilter = Boolean(sizeValue || sizeUnitTerms.length > 0);

  if (hasSizeFilter) {
    andConditions.push({
      variants: {
        some: {
          ...(sizeValue
            ? {
                customSize: {
                  contains: String(sizeValue),
                  mode: "insensitive",
                },
              }
            : {}),
          ...(sizeUnitTerms.length > 0
            ? {
                sizeUnit: { in: sizeUnitTerms as unknown as SizeUnit[] },
              }
            : {}),
        },
      },
    });
  }

  const whereCondition: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // variant filter (response level)
  const variantWhereCondition: Prisma.ProductVariantWhereInput =
    hasSizeFilter
      ? {
          ...(sizeValue
            ? {
                customSize: {
                  contains: String(sizeValue),
                  mode: "insensitive",
                },
              }
            : {}),
          ...(sizeUnitTerms.length > 0
            ? {
                sizeUnit: { in: sizeUnitTerms as unknown as SizeUnit[] },
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

        variants: {
          where: variantWhereCondition,
          select: {
            id: true,
            customSize: true,
            sizeUnit: true, // 🔥 add this
            price: true,
            discountPrice: true,
            imageUrl: true,
            stockQuantity: true,
            isDefault: true,
          },
          orderBy: { customSize: "asc" },
        },
      },
    }),
    prisma.product.count({ where: whereCondition }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const getAllProducts = async (query: Record<string, any>) => {
  const key = `cache:product:list:${stableQueryHash(query as Record<string, unknown>)}`;
  return cacheGetOrSet(key, CacheTTL.productList, () =>
    getAllProductsUncached(query)
  );
};

const getProductDetails = async (slug: string) => {
  return cacheGetOrSet(
    `cache:product:detail:${slug}`,
    CacheTTL.productDetail,
    async () => getProductDetailsUncached(slug)
  );
};

const getProductDetailsUncached = async (slug: string) => {
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
    defaultVariant?.discountPrice && defaultVariant?.price
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

  const machineSize = defaultVariant?.customSize || null;

  return {
    ...product,
    defaultVariant,
    effectivePrice,
    discountPercent,
    machineSize
  };
};

const getRelatedProductsUncached = async (slug: string) => {
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

const getRelatedProducts = async (slug: string) => {
  return cacheGetOrSet(
    `cache:product:related:${slug}`,
    CacheTTL.productRelated,
    () => getRelatedProductsUncached(slug)
  );
};



const updateProduct = async (id: string, payload: any) => {
  const {
    name,
    slug,
    basePrice,
    discountPrice,
    availability,
    brand,
    productType,
    productCategoryId,
    shortDescription,
    description,
    images,
    variants,
    keyPoints,
    stockQuantity,
    damagedQty,
    reorderLevel,
    reservedQty,
    visibility,
  } = payload;

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  if (productCategoryId) {
    const category = await prisma.productCategory.findUnique({
      where: { id: productCategoryId },
    });

    if (!category) {
      throw new Error("Product category not found");
    }
  }

  const parsedBasePrice =
    basePrice !== undefined && basePrice !== null && basePrice !== ""
      ? Number(basePrice)
      : existingProduct.basePrice;

  const parsedDiscountPrice =
    discountPrice !== undefined && discountPrice !== null && discountPrice !== ""
      ? Number(discountPrice)
      : null;

  const discountPercent =
    parsedDiscountPrice && parsedDiscountPrice < parsedBasePrice
      ? Math.round(
          ((parsedBasePrice - parsedDiscountPrice) / parsedBasePrice) * 100
        )
      : null;

  await prisma.product.update({
    where: { id },
    data: {
      name: name ?? undefined,
      slug: slug ?? undefined,
      basePrice:
        basePrice !== undefined && basePrice !== null && basePrice !== ""
          ? Number(basePrice)
          : undefined,
      discountPrice:
        discountPrice !== undefined
          ? discountPrice === null || discountPrice === ""
            ? null
            : Number(discountPrice)
          : undefined,
      discountPercent,
      availability: availability ?? undefined,
      brand: brand ?? undefined,
      productType:
        productType !== undefined
          ? productType === "" || productType === null
            ? null
            : productType
          : undefined,
      productCategoryId: productCategoryId ?? undefined,
      shortDescription: shortDescription ?? undefined,
      description: description ?? undefined,
      keyPoints: keyPoints !== undefined ? keyPoints : undefined,
      stockQuantity:
        stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ""
          ? Number(stockQuantity)
          : undefined,
      damagedQty:
        damagedQty !== undefined && damagedQty !== null && damagedQty !== ""
          ? Number(damagedQty)
          : undefined,
      reorderLevel:
        reorderLevel !== undefined && reorderLevel !== null && reorderLevel !== ""
          ? Number(reorderLevel)
          : undefined,
      reservedQty:
        reservedQty !== undefined && reservedQty !== null && reservedQty !== ""
          ? Number(reservedQty)
          : undefined,
      visibility:
        visibility !== undefined
          ? visibility === true || visibility === "true"
          : undefined,
    },
  });

  // replace images only if new images are sent
  if (images && Array.isArray(images) && images.length > 0) {
    await prisma.productImage.deleteMany({
      where: { productId: id },
    });

    await prisma.productImage.createMany({
      data: images.map((img: any, index: number) => ({
        productId: id,
        imageUrl: img.imageUrl,
        isPrimary:
          img.isPrimary !== undefined
            ? img.isPrimary === true || img.isPrimary === "true"
            : index === 0,
        orderIndex:
          img.orderIndex !== undefined ? Number(img.orderIndex) : index,
      })),
    });
  }

  const parsedVariants = Array.isArray(variants)
    ? variants
    : variants
    ? JSON.parse(variants)
    : [];

  // replace variants only if variants field is sent
  if (variants !== undefined) {
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    });

    if (parsedVariants.length > 0) {
      await prisma.productVariant.createMany({
        data: parsedVariants.map((variant: any) => ({
          productId: id,
          customSize: variant.customSize,
          sizeUnit: variant.sizeUnit as SizeUnit,
          price: Number(variant.price),
          discountPrice:
            variant.discountPrice !== undefined &&
            variant.discountPrice !== null &&
            variant.discountPrice !== ""
              ? Number(variant.discountPrice)
              : null,
          imageUrl: variant.imageUrl || null,
          stockQuantity:
            variant.stockQuantity !== undefined &&
            variant.stockQuantity !== null &&
            variant.stockQuantity !== ""
              ? Number(variant.stockQuantity)
              : 0,
          isDefault:
            variant.isDefault === true || variant.isDefault === "true",
        })),
      });
    }
  }

  const updatedProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { orderIndex: "asc" },
      },
      productCategory: true,
      variants: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  await invalidateProductReadCaches().catch(() => undefined);

  return updatedProduct;
};




const deleteProduct = async (id: string) => {
  const result = await prisma.product.update({
    where: { id },
    data: {
      visibility: false,
    },
  });
  await invalidateProductReadCaches().catch(() => undefined);
  return result;
};

const getAllProductBrandsUncached = async () => {
  const rows = await prisma.product.findMany({
    where: {
      visibility: true,
      NOT: { brand: null },
    },
    distinct: ["brand"],
    select: { brand: true },
  });

  const brands = rows
    .map((r) => r.brand)
    .filter((b): b is string => typeof b === "string" && b.trim().length > 0);

  return brands.sort((a, b) => a.localeCompare(b));
};

const getAllProductBrands = async () => {
  return cacheGetOrSet(
    "cache:product:brands",
    CacheTTL.productBrands,
    getAllProductBrandsUncached
  );
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getAllProductBrands,
  getProductDetails,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
};
