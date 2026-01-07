import { Request, Response } from "express";
import { OrderService } from "./order.service";

const checkout = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await OrderService.checkoutFromCart(userId, req.body);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: result,
  });
};


const getMyOrders = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await OrderService.getMyOrders(userId, req.query);

  res.status(200).json({
    success: true,
    meta: result.meta,
    data: result.data,
  });
};



const getOrderDetails = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { orderId } = req.params;

  const result = await OrderService.getOrderDetails(userId, orderId);

  res.status(200).json({
    success: true,
    data: result,
  });
};




const cancelOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { orderId } = req.params;

  const result = await OrderService.cancelOrder(userId, orderId);

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: result,
  });
};

// ------------------- ONLY for Admin -------------------

const getAllOrdersAdmin = async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrdersAdmin(req.query);

  res.status(200).json({
    success: true,
    meta: result.meta,
    data: result.data,
  });
};


const getOrderDetailsAdmin = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const result = await OrderService.getOrderDetailsAdmin(orderId);

  res.status(200).json({
    success: true,
    data: result,
  });
};



const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const result = await OrderService.updateOrderStatus(orderId, status);

  res.status(200).json({
    success: true,
    message: "Order status updated",
    data: result,
  });
};


export const OrderController = {
  
  checkout ,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatus,

};
