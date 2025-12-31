import { OrderStatus } from "@prisma/client";
import { getShippingFee } from "../../../helper/Shipping";
import { prisma } from "../../shared/prisma";
import { CheckoutPayload } from "./order.interface";


const checkoutFromCart = async (userId: string, payload: CheckoutPayload) => {
  const {
    paymentMethod,
    customerName,
    phone,
    addressLine1,
    addressLine2,
    city,
    area,
    note,
  } = payload;

  if (!paymentMethod || !customerName || !phone || !addressLine1) {
    throw new Error("Missing checkout fields");
  }

  return prisma.$transaction(async (tx) => {
    // 1) Load cart with items + product snapshots
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, visibility: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // 2) Validate products
    for (const item of cart.items) {
      if (!item.product || !item.product.visibility) {
        throw new Error("One or more products are unavailable");
      }
      if (item.quantity < 1) {
        throw new Error("Invalid quantity in cart");
      }
    }

    // 3) Calculate totals (using snapshot price stored in CartItem.price)
    const subTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // const shippingFee = 0;
    // const discountTotal = 0;
    // const totalAmount = subTotal + shippingFee - discountTotal;


    const shippingFee = await getShippingFee(
  city as string,
  paymentMethod
);

const totalAmount =
  subTotal + shippingFee;


    const order = await tx.order.create({
      data: {
        userId,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "UNPAID" : "UNPAID",
        status: "PENDING",

        subTotal,
        shippingFee,
     
        totalAmount,

        customerName,
        phone,
        addressLine1,
        addressLine2,
        city,
        area,
        note,

        items: {
          create: cart.items.map((ci) => ({
            productId: ci.productId,
            productName: ci.product!.name,
            productSlug: ci.product!.slug,
            unitPrice: ci.price,
            quantity: ci.quantity,
            lineTotal: ci.price * ci.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

 
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
};




const getMyOrders = async (userId: string, query: any) => {
  const { page = 1, limit = 10, status, paymentStatus, sort } = query;

  const where: any = {
    userId,
  };

  if (status) where.status = { in: String(status).split(",") };
  if (paymentStatus) where.paymentStatus = { in: String(paymentStatus).split(",") };

  let orderBy: any = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        subTotal: true,
        shippingFee: true,
  
        totalAmount: true,
        createdAt: true,
      
        items: {
          take: 3,
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: orders,
  };
};



const getOrderDetails = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId, // 🔐 ownership check
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          productName: true,
          productSlug: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};



const cancelOrder = async (userId: string, orderId: string) => {
  // 1️⃣ Find order (ownership check)
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // 2️⃣ Prevent double cancel
  if (order.status === "CANCELLED") {
    throw new Error("Order already cancelled");
  }

  // 3️⃣ Cancel rules
  const cancellableStatuses = ["PENDING", "CONFIRMED"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(
      `Order cannot be cancelled at ${order.status} stage`
    );
  }

  // 4️⃣ Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
    },
  });

  return updatedOrder;
};





//  -------------------------- ONLY for Admin ------------------------------------



const getAllOrdersAdmin = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    paymentMethod,
    sort,
  } = query;

  const where: any = {};

  if (status) where.status = { in: String(status).split(",") };
  if (paymentStatus)
    where.paymentStatus = { in: String(paymentStatus).split(",") };
  if (paymentMethod)
    where.paymentMethod = { in: String(paymentMethod).split(",") };

  let orderBy: any = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      
      select: {
        id: true,
        userId: true,
      
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        subTotal: true,
        shippingFee: true,
      
        totalAmount: true,
        createdAt: true,
        customerName: true,
        phone: true,
        city: true,



              items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          productSlug: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },




        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: orders,
  };
};




const getOrderDetailsAdmin = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          productName: true,
          productSlug: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};



const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

const updateOrderStatus = async (
  orderId: string,
  newStatus: string
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new Error(
      `Order already ${order.status.toLowerCase()}`
    );
  }

  const allowedNextStatuses =
    ALLOWED_TRANSITIONS[order.status] || [];

  if (!allowedNextStatuses.includes(newStatus)) {
    throw new Error(
      `Cannot change status from ${order.status} to ${newStatus}`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus as OrderStatus,
    },
  });
};


export const OrderService = {
  
  checkoutFromCart,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatus,
};
