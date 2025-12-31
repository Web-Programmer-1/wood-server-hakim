// cart.controller.ts
import { Request, Response } from "express";
import { CartService } from "./cart.service";

const addToCart = async (req: Request, res: Response) => {
  const userId = req.user!.id; // auth middleware থেকে
  const result = await CartService.addToCart(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Product added to cart",
    data: result,
  });
};


const getCart = async (req: Request, res: Response) => {
  const userId = req.user!.id; // auth middleware থেকে

  const result = await CartService.getCart(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};



const updateQuantity = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { itemId } = req.params;
  const { quantity } = req.body;
   console.log(userId)
  const result = await CartService.updateQuantity(userId, itemId, quantity);

  res.status(200).json({
    success: true,
    message: "Cart item quantity updated",
    data: result,
  });
};



const removeItem = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { itemId } = req.params;

  await CartService.removeItem(userId, itemId);

  res.status(200).json({
    success: true,
    message: "Cart item removed successfully",
  });
};






export const CartController = {
  addToCart,
  getCart,
  updateQuantity,
  removeItem
};
