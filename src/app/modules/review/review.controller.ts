import { Request, Response } from "express";
import { createReview, deleteReviewAdmin, getAllReviewsAdmin, getProductReviews } from "./review.service";

export const createReviewHandler = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await createReview(userId, req.body);

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    data: result,
  });
};




export const getProductReviewsHandler = async (
  req: Request,
  res: Response
) => {
  const productId = req.params.productId as string;

  const reviews = await getProductReviews(productId);

  res.status(200).json({
    success: true,
    data: reviews,
  });
};





//  Review Controll for Admin -------------------------------------------------




export const getAllReviewsAdminHandler = async (
  req: Request,
  res: Response
) => {
  const result = await getAllReviewsAdmin(req.query);

  res.status(200).json({
    success: true,
    meta: result.meta,
    data: result.data,
  });
};








export const deleteReviewAdminHandler = async (
  req: Request,
  res: Response
) => {
  const reviewId = req.params.reviewId as string;

  await deleteReviewAdmin(reviewId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
};
