import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { PaperflyService } from "../courier/courier.service";
import { prisma } from "../../shared/prisma";
import { HttpStatusCode } from "axios";

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






const getMyOrderTracking = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    // Handle the case where userId is undefined
    return res.status(400).json({
      success: false,
      message: "User ID is missing",
    });
  }

  const { orderId } = req.params;

  const data = await OrderService.getMyOrderTracking(userId, orderId);

  res.status(200).json({
    success: true,
    data,
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



// Order Tracking Paperfly




const trackOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (!order.trackingNumber) {
    return res.status(200).json({
      success: true,
      data: {
        success: {
          message: "Tracking not available yet",
          trackingStatus: [],
        },
        response_code: 200,
      },
    });
  }

  try {
    const tracking = await PaperflyService.track(order.trackingNumber);

    return res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Paperfly tracking failed:", error);

    return res.status(200).json({
      success: true,
      data: {
        success: {
          message: "Tracking not available yet",
          trackingStatus: [],
        },
        response_code: 200,
      },
    });
  }
};



const deleteOrder = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await OrderService.deleteOrder(id);

  res.status(HttpStatusCode.Accepted).json({
    success: true,
    message: result.message,
  });
};


export const OrderController = {
  
  checkout ,
  getMyOrders,
  getMyOrderTracking,
  getOrderDetails,
  cancelOrder,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatus,
  trackOrder,
  deleteOrder,

};
