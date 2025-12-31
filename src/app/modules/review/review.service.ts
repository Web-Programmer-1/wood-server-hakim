import { ApiError } from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";

import httpStatus from "http-status";

export const createReview = async (
  userId: string,
  payload: {
    productId: string;
    rating: number;
    comment?: string;
  }
) => {
  const { productId, rating, comment } = payload;

  // 1️⃣ Validate rating
  if (rating < 1 || rating > 5) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Rating must be between 1 to 5");
  }

  return await prisma.$transaction(async (tx) => {
    // 2️⃣ Prevent duplicate review
    const existingReview = await tx.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "You already reviewed this product"
      );
    }

    // 3️⃣ Create review
    await tx.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });

    // 4️⃣ Recalculate rating
    const aggregation = await tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating = aggregation._avg.rating || 0;
    const ratingCount = aggregation._count.rating;

    // 5️⃣ Update product
    await tx.product.update({
      where: { id: productId },
      data: {
        rating: Number(avgRating.toFixed(1)),
        ratingCount,
      },
    });

    return {
      rating: avgRating,
      ratingCount,
    };
  });
};






export const getProductReviews = async (productId: string) => {
  return prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          profile: {
            select: {
              avatarUri: true,
            },
          },
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};





//  Reviem Contoll for Admin -------------------------------------------------



export const getAllReviewsAdmin = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    rating,
    productId,
    userId,
  } = query;

  const where: any = {};

  if (rating) {
    where.rating = Number(rating);
  }

  if (productId) {
    where.productId = productId;
  }

  if (userId) {
    where.userId = userId;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: Number(limit),
    }),
    prisma.review.count({ where }),
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











export const deleteReviewAdmin = async (reviewId: string) => {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    await tx.review.delete({
      where: { id: reviewId },
    });

    // Recalculate product rating
    const aggregation = await tx.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.product.update({
      where: { id: review.productId },
      data: {
        rating: Number((aggregation._avg.rating || 0).toFixed(1)),
        ratingCount: aggregation._count.rating,
      },
    });

    return true;
  });
};
