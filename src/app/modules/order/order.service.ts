import { CouponDiscountType, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { getShippingFee } from "../../../helper/Shipping";
import { prisma } from "../../shared/prisma";

import { SSLCommerzService } from "../payment/payment.service";

import { PaperflyService } from "../courier/courier.service";
import { tr } from "zod/v4/locales";
import { getDhakaDayRangeUtc, getDhakaRangeUtcInclusive, getDhakaThisMonthRangeUtc, getDhakaThisWeekRangeUtc, toInt } from "./OrderCustomDate";

const applyCoupon = async (
  tx: any,
  userId: string,
  couponCode: string,
  subTotal: number
) => {
  const coupon = await tx.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
  });

  if (!coupon) throw new Error("Invalid coupon");
  if (!coupon.isActive) throw new Error("Coupon inactive");
  if (coupon.endAt < new Date()) throw new Error("Coupon expired");

  if (subTotal < coupon.minOrderAmount) {
    throw new Error(`Minimum order ${coupon.minOrderAmount} required`);
  }

  if (
    coupon.totalUsageLimit &&
    coupon.usedCount >= coupon.totalUsageLimit
  ) {
    throw new Error("Coupon usage limit reached");
  }

  if (coupon.perUserLimit) {
    const used = await tx.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (used >= coupon.perUserLimit) {
      throw new Error("Coupon already used");
    }
  }

  let discount = 0;
  if (coupon.discountType === CouponDiscountType.PERCENT) {
    discount = Math.floor((subTotal * coupon.discountValue) / 100);
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maxDiscountAmount) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  discount = Math.min(discount, subTotal);

  return {
    couponId: coupon.id,
    couponCode: coupon.code,
    discountTotal: discount,
  };
};





export const checkoutFromCart = async (userId: string, payload: any) => {
  const {
    paymentMethod,
    customerName,
    phone,
    addressLine1,
    addressLine2,
    city,
    area,
    note,
    couponCode,
      weight, 
  } = payload;

  if (!paymentMethod || !customerName || !phone || !addressLine1) {
    throw new Error("Missing checkout fields");
  }

  const finalWeight = weight ? Number(weight) : 1;


  // 🔹 STEP 1: transaction result ধরছি
  const result = await prisma.$transaction(async (tx) => {
    // 1️⃣ Load cart
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

    // 2️⃣ Validate products
    for (const item of cart.items) {
      if (!item.product || !item.product.visibility) {
        throw new Error(`Product ${item.product?.name} unavailable`);
      }
    }

    // 3️⃣ Subtotal
    const subTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 4️⃣ Shipping
    const shippingFee = await getShippingFee(city, paymentMethod);

    // 5️⃣ Coupon
    let discountTotal = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const couponResult = await applyCoupon(
        tx,
        userId,
        couponCode,
        subTotal
      );

      discountTotal = couponResult.discountTotal;
      appliedCouponId = couponResult.couponId;
      appliedCouponCode = couponResult.couponCode;
    }

    // 6️⃣ Final total
    const totalAmount = subTotal - discountTotal + shippingFee;

    // 7️⃣ Create order
    const order = await tx.order.create({
      data: {
        userId,
        paymentMethod,
        status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",

        subTotal,
        discountTotal,
        shippingFee,
        totalAmount,

        couponCode: appliedCouponCode,

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
    });

    // 8️⃣ Coupon usage
    if (appliedCouponId) {
      await tx.couponUsage.create({
        data: {
          couponId: appliedCouponId,
          userId,
          orderId: order.id,
        },
      });

      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 9️⃣ Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // 🔟 Payment handling
    if (paymentMethod === "COD") {
      return { type: "COD", order };
    }

   

    // SSLCOMMERZ
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "SSLCOMMERZ",
        amount: totalAmount,
        status: "INITIATED",
      },
    });

    const session = await SSLCommerzService.createSession({
      orderId: order.id,
      amount: totalAmount,
      customerName,
      phone,
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: order.id,
        sessionKey: session.sessionkey,
        redirectUrl: session.GatewayPageURL,
        status: "PENDING",
      },
    });

    return {
      type: "REDIRECT",
      provider: "SSLCOMMERZ",
      redirectUrl: session.GatewayPageURL,
      orderId: order.id,
    };
  });

  // if (result.type === "COD") {
  //   const order = result.order!;

  //   const courierRes = await PaperflyService.createOrder({
  //     ...order,
  //     weight: finalWeight,
  //   });

  //   await prisma.order.update({
  //     where: { id: order.id },
  //     data: {
  //       courierName: "PAPERFLY",
  //       trackingNumber: courierRes.tracking_number,
  //       trackingBarcode: courierRes.tracking_barcode,
  //       status: OrderStatus.CONFIRMED,
  //     },
  //   });

  //   const trackingUrl = `https://go.paperfly.com.bd/track/order/${courierRes.tracking_number}`;

  //   return {
  //     type: "COD",
  //     orderId: order.id,
  //     trackingNumber: courierRes.tracking_number,
  //     trackingUrl,
  //   };
  // }



  if (result.type === "COD") {
  const order = result.order!;

//   const courierRes = await PaperflyService.createOrder({
//     ...order,
//     weight: finalWeight,
//   });

//   console.log("Courier Response",courierRes)

//   await prisma.order.update({
//     where: { id: order.id },
//     data: {
//       courierName: "PAPERFLY",

//       // 👇 Z- tracking id (panel use)
//       trackingNumber: courierRes.tracking_number,

//       // 👇 Barcode
//       trackingBarcode: courierRes.tracking_barcode,

//       // 👇 🔥 IMPORTANT — UUID save করো
//       trackingToken: courierRes.referenceNumber,

//       status: OrderStatus.CONFIRMED,
//     },
//   });

//   const trackingUrl = `https://go.paperfly.com.bd/track/order/${courierRes.tracking_number}`;

//   return {
//     type: "COD",
//     orderId: order.id,
//     trackingNumber: courierRes.tracking_number,
//     trackingUrl,
//   };
// }

const courierRes = await PaperflyService.createOrder({
  ...order,
  weight: finalWeight,
});

// createOrder এর response structure অনুযায়ী
// তুমি আগে বলছিলে courierRes.data.success এর ভিতরে tracking_number আছে
const success = courierRes?.success || courierRes?.data?.success || courierRes;

await prisma.order.update({
  where: { id: order.id },
  data: {
    courierName: "PAPERFLY",
    trackingNumber: success?.tracking_number || null,
    trackingBarcode: success?.tracking_barcode || null,

    // ✅ IMPORTANT: trackingToken = order.id (merchant reference)
    trackingToken: order.id,

    status: OrderStatus.CONFIRMED,
  },
})

  }






  return result;
};



















// export const checkoutFromCart = async (userId: string, payload: any) => {
//   const {
//     paymentMethod,
//     customerName,
//     phone,
//     addressLine1,
//     addressLine2,
//     city,
//     area,
//     note,
//     couponCode, // optional
//   } = payload;

//   if (!paymentMethod || !customerName || !phone || !addressLine1) {
//     throw new Error("Missing checkout fields");
//   }

//   return prisma.$transaction(async (tx) => {
//     // 1️⃣ Load cart
//     const cart = await tx.cart.findUnique({
//       where: { userId },
//       include: {
//         items: {
//           include: {
//             product: {
//               select: { id: true, name: true, slug: true, visibility: true },
//             },
//           },
//         },
//       },
//     });

//     if (!cart || cart.items.length === 0) {
//       throw new Error("Cart is empty");
//     }

//     // 2️⃣ Validate products
//     for (const item of cart.items) {
//       if (!item.product || !item.product.visibility) {
//         throw new Error(`Product ${item.product?.name} unavailable`);
//       }
//     }

//     // 3️⃣ Subtotal
//     const subTotal = cart.items.reduce(
//       (sum, item) => sum + item.price * item.quantity,
//       0
//     );

//     // 4️⃣ Shipping
//     const shippingFee = await getShippingFee(city, paymentMethod);

//     // 5️⃣ Coupon
//     let discountTotal = 0;
//     let appliedCouponId: string | null = null;
//     let appliedCouponCode: string | null = null;

//     if (couponCode) {
//       const couponResult = await applyCoupon(
//         tx,
//         userId,
//         couponCode,
//         subTotal
//       );

//       discountTotal = couponResult.discountTotal;
//       appliedCouponId = couponResult.couponId;
//       appliedCouponCode = couponResult.couponCode;
//     }

//     // 6️⃣ Final total
//     const totalAmount = subTotal - discountTotal + shippingFee;

//     // 7️⃣ Create order
//     const order = await tx.order.create({
//       data: {
//         userId,
//         paymentMethod,
//         status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",

//         subTotal,
//         discountTotal,
//         shippingFee,
//         totalAmount,

//         couponCode: appliedCouponCode,

//         customerName,
//         phone,
//         addressLine1,
//         addressLine2,
//         city,
//         area,
//         note,

//         items: {
//           create: cart.items.map((ci) => ({
//             productId: ci.productId,
//             productName: ci.product!.name,
//             productSlug: ci.product!.slug,
//             unitPrice: ci.price,
//             quantity: ci.quantity,
//             lineTotal: ci.price * ci.quantity,
//           })),
//         },
//       },
//     });

//     // 8️⃣ Save coupon usage
//     if (appliedCouponId) {
//       await tx.couponUsage.create({
//         data: {
//           couponId: appliedCouponId,
//           userId,
//           orderId: order.id,
//         },
//       });

//       await tx.coupon.update({
//         where: { id: appliedCouponId },
//         data: { usedCount: { increment: 1 } },
//       });
//     }

//     // 9️⃣ Clear cart
//     await tx.cartItem.deleteMany({
//       where: { cartId: cart.id },
//     });

//     // 🔟 Payment handling
//     // if (paymentMethod === "COD") {
//     //   return { type: "COD", order };
//     // }




//     if (paymentMethod === "COD") {
//   // Create courier order
//   const courier = await PaperflyService.createOrder(order);

//   await tx.order.update({
//     where: { id: order.id },
//     data: {
//       courierName: "PAPERFLY",
//       trackingNumber: courier.tracking_number,
//       trackingBarcode: courier.tracking_barcode,
//       status: "CONFIRMED",
//     },
//   });






//   return {
//     type: "COD",
//     orderId: order.id,
//     trackingNumber: courier.tracking_number,
//   };
// }






    
// // BKASH
// if (paymentMethod === "BKASH") {
//   const bkash = await BkashService.createBkashPayment(
//     userId,
//     order.id,
//     totalAmount
//   );

//   await tx.payment.create({
//     data: {
//       orderId: order.id,
//       provider: "BKASH",
//       amount: totalAmount,
//       transactionId: bkash.paymentID,
//       status: "PENDING",
//       redirectUrl: bkash.bkashURL,
//     },
//   });

//   return {
//     type: "REDIRECT",
//     provider: "BKASH",
//     redirectUrl: bkash.bkashURL,
//     orderId: order.id,
//   };
// }




//     // SSLCOMMERZ
//     const payment = await tx.payment.create({
//       data: {
//         orderId: order.id,
//         provider: "SSLCOMMERZ",
//         amount: totalAmount,
//         status: "INITIATED",
//       },
//     });

//     const session = await SSLCommerzService.createSession({
//       orderId: order.id,
//       amount: totalAmount,
//       customerName,
//       phone,
//     });

//     await tx.payment.update({
//       where: { id: payment.id },
//       data: {
//         transactionId: order.id,
//         sessionKey: session.sessionkey,
//         redirectUrl: session.GatewayPageURL,
//         status: "PENDING",
//       },
//     });

//     return {
//       type: "REDIRECT",
//       provider: "SSLCOMMERZ",
//       redirectUrl: session.GatewayPageURL,
//       orderId: order.id,
//     };
//   });
// };





























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
      userId, 
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

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }


  if (order.status === "CANCELLED") {
    throw new Error("Order already cancelled");
  }


  const cancellableStatuses = ["PENDING", "CONFIRMED"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(
      `Order cannot be cancelled at ${order.status} stage`
    );
  }

  
  if (order.courierName === "PAPERFLY" && order.trackingNumber) {
    try {
      await PaperflyService.cancel(order.trackingNumber);
    } catch (error) {
      console.error("Paperfly cancel failed:", error);

    }
  }


  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
    },
  });

  return updatedOrder;
};





const getAllOrdersAdmin = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    paymentMethod,
    sort,

    // ✅ new
    date,       // "YYYY-MM-DD"
    startDate,  // "YYYY-MM-DD"
    endDate,    // "YYYY-MM-DD" (inclusive)
    period,     // "weekly" | "monthly"
    weekStart,  // 0..6 (optional)
  } = query;

  const where: any = {};

  if (status) where.status = { in: String(status).split(",") };
  if (paymentStatus) where.paymentStatus = { in: String(paymentStatus).split(",") };
  if (paymentMethod) where.paymentMethod = { in: String(paymentMethod).split(",") };

  // ✅ createdAt filter
  const createdAt: any = {};

  if (period === "weekly") {
    const ws = Math.min(6, Math.max(0, toInt(weekStart, 1))); // default Monday=1
    const { start, end } = getDhakaThisWeekRangeUtc(ws);
    createdAt.gte = start;
    createdAt.lt = end;
  } else if (period === "monthly") {
    const { start, end } = getDhakaThisMonthRangeUtc();
    createdAt.gte = start;
    createdAt.lt = end;
  } else if (date) {
    const r = getDhakaDayRangeUtc(String(date));
    if (r) {
      createdAt.gte = r.start;  
      createdAt.lt = r.end;
    }
  } else if (startDate && endDate) {
    const r = getDhakaRangeUtcInclusive(String(startDate), String(endDate));
    if (r) {
      createdAt.gte = r.start;
      createdAt.lt = r.end;
    }
  }

  if (Object.keys(createdAt).length) {
    where.createdAt = createdAt;
  }

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
        payments: {
          select: {
            id: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
        _count: { select: { items: true } },
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



const deleteOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error( "Order not found");
  }

  await prisma.order.delete({
    where: { id: orderId },
  });

  return {
    message: "Order deleted successfully",
  };
};






const getMyOrderTracking = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      courierName: true,
      trackingNumber: true,
      trackingBarcode: true,
      trackingToken: true,
      status: true,
      createdAt: true,
    },
  });

  if (!order || order.courierName !== "PAPERFLY") {
    return {
      order: order || null,
      referenceNumber: null,
      tracking: {
        success: {
          message: "Tracking not available yet",
          trackingStatus: [],
        },
        response_code: 200,
      },
    };
  }

  const referenceNumber = order.trackingToken || order.id;

  try {
    const tracking = await PaperflyService.track(referenceNumber);

    return {
      order,
      referenceNumber,
      tracking,
    };
  } catch (error) {
    console.error("Paperfly tracking failed:", error);

    return {
      order,
      referenceNumber,
      tracking: {
        success: {
          message: "Tracking not available yet",
          trackingStatus: [],
        },
        response_code: 200,
      },
    };
  }
};



//  Top Selling Products 




const getTopSellingProducts = async (query: Record<string, any>) => {
  const limit = Number(query.limit) || 8;
  const categoryId = query.categoryId;
  const brand = query.brand;
  const availability = query.availability;

  const productWhere: Prisma.ProductWhereInput = {
    visibility: true,
    ...(categoryId && { productCategoryId: categoryId }),
    ...(brand && {
      brand: { contains: String(brand), mode: "insensitive" },
    }),
    ...(availability && { availability }),
  };

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: {
          not: "CANCELLED",
        },
      },
      product: productWhere,
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  if (!grouped.length) {
    return [];
  }

  const productIds = grouped.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      discountPrice: true,
      availability: true,
      brand: true,
      productType: true,
      images: {
        select: {
          id: true,
          imageUrl: true,
          isPrimary: true,
          orderIndex: true,
          productId: true,
        },
        orderBy: [{ isPrimary: "desc" }, { orderIndex: "asc" }],
        take: 1,
      }
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return grouped
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        discountPrice: product.discountPrice,
        availability: product.availability,
        brand: product.brand,
        productType: product.productType,
        images: product.images,
      };
    })
    .filter(Boolean);
};



export const OrderService = {
  
  checkoutFromCart,
  getMyOrders,
  getMyOrderTracking,
  getOrderDetails,
  cancelOrder,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatus,
  deleteOrder,
  getTopSellingProducts
};
