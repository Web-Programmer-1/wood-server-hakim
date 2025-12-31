import { prisma } from "../../shared/prisma";




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

//   const product = await prisma.product.create({
//     data: {
//       name,
//       slug,
//       basePrice: base,
//       discountPrice: discount,
//       availability,
//       brandType,
//       productType,
//       description,
//       shortDescription,
//       productCategoryId,
//       images: {
//         create: images || [],
//       },
//     },

//      keyPoints: keyPoints?.length
//         ? {
//             create: keyPoints.map((text: string, index: number) => ({
//               text,
//               order: index,
//             })),
//           }
//         : undefined,
//     },


//     include: {
//       images: true,
//       productCategory: true,
//     },
//   });


//   const discountPercent =
//     discount && discount < base
//       ? Math.round(((base - discount) / base) * 100)
//       : null;

//   return {
//     ...product,
//     discountPercent,
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

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      basePrice: base,
      discountPrice: discount,
      availability,
      brandType,
      productType,
      description,
      shortDescription,
      productCategoryId,

      images: {
        create: images || [],
      },

     
      keyPoints: keyPoints?.length
        ? {
            create: keyPoints.map((text: string, index: number) => ({
              text,
              order: index,
            })),
          }
        : undefined,
    },

    include: {
      images: true,
      keyPoints: {
        orderBy: { order: "asc" },
      },
      productCategory: true,
    },
  });

  const discountPercent =
    discount && discount < base
      ? Math.round(((base - discount) / base) * 100)
      : null;

  return {
    ...product,
    discountPercent,
  };
};




const getAllProducts = async (query: any) => {
  const {
    category,
    minPrice,
    maxPrice,
    availability,
    brandType,
    ratingGte,
    productType,
    sort,
    page = 1,
    limit = 12,
  } = query;

  const where: any = {
    visibility: true,
  };

  //  Category filter (top cards)
  if (category) {
    where.productCategory = {
      slug: category,
    };
  }

  //  Availability filter
  if (availability) {
    where.availability = {
      in: availability.split(","),
    };
  }

  //  Brand filter
  if (brandType) {
    where.brandType = {
      in: brandType.split(","),
    };
  }

  //  Product type
  if (productType) {
    where.productType = productType;
  }

  //  Rating filter
  if (ratingGte) {
    where.rating = {
      gte: Number(ratingGte),
    };
  }

  // Price filter (effective price)
  if (minPrice || maxPrice) {
    where.OR = [
      {
        discountPrice: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      },
      {
        discountPrice: null,
        basePrice: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      },
    ];
  }

  //  Sorting
  let orderBy: any = { createdAt: "desc" };

  if (sort === "price_asc") {
    orderBy = { basePrice: "asc" };
  }
  if (sort === "price_desc") {
    orderBy = { basePrice: "desc" };
  }
  if (sort === "rating_desc") {
    orderBy = { rating: "desc" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: true,
        productCategory: true,
      },
      orderBy,
      skip,
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
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
    },
  });

  if (!product || !product.visibility) {
    throw new Error("Product not found");
  }

  // 🔹 Discount calculation
  const effectivePrice =
    product.discountPrice ?? product.basePrice;

  const discountPercent = product.discountPrice
    ? Math.round(
        ((product.basePrice - product.discountPrice) /
          product.basePrice) *
          100
      )
    : null;

  return {
    ...product,
    effectivePrice,
    discountPercent,
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
  } = payload;

  // 🔹 update main product
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      basePrice: basePrice ? Number(basePrice) : undefined,
      discountPrice: discountPrice
        ? Number(discountPrice)
        : undefined,
      availability,
      brandType,
      productType,
      productCategoryId,
      shortDescription,
      description,
    },
  });

  // 🔹 replace images if new images uploaded
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

  const image = prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      productCategory: true,
    },
  });

  return {
    product,
    image,
  }

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
