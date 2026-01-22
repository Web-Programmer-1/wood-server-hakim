import { OrderStatus, PaymentMethod } from "@prisma/client";
import { getShippingFee } from "../../../helper/Shipping";
import { prisma } from "../../shared/prisma";
import { CheckoutPayload } from "./order.interface";
import { SSLCommerzService } from "../payment/payment.service";
import { BkashService } from "../bkashPayment/bkash.service";





// const checkoutFromCart = async (userId: string, payload:any) => {
//   const {
//     paymentMethod,
//     customerName,
//     phone,
//     addressLine1,
//     addressLine2,
//     city,
//     area,
//     note,
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
//         throw new Error("One or more products are unavailable");
//       }
//       if (item.quantity < 1) {
//         throw new Error("Invalid quantity in cart");
//       }
//     }

//     // 3️⃣ Calculate subtotal
//     const subTotal = cart.items.reduce(
//       (sum, item) => sum + item.price * item.quantity,
//       0
//     );

//     const shippingFee = await getShippingFee(
//       city as string,
//       paymentMethod as "COD" || "ONLINE" ,
//     );

//     const totalAmount = subTotal + shippingFee;

//     // 4️⃣ Create ORDER (always first)
//     const order = await tx.order.create({
//       data: {
//         userId,
//         paymentMethod,
//         // paymentStatus: paymentMethod === "COD" ? "UNPAID" : "PENDING",
//         status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",

//         subTotal,
//         shippingFee,
//         totalAmount,

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

//     // 5️⃣ Clear cart
//     await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

//     // ===============================
//     // 🔀 PAYMENT METHOD BRANCH
//     // ===============================

//     // ✅ COD FLOW (DONE)
//     if (paymentMethod === "COD") {
//       return {
//         type: "COD",
//         order,
//       };
//     }

//     // 🔁 SSLCOMMERZ FLOW
//     if (paymentMethod === "SSLCOMMARZE") {
//       // 6️⃣ Create Payment record
//       const payment = await tx.payment.create({
//         data: {
//           orderId: order.id,
//           provider: "SSLCOMMERZ",
//           amount: totalAmount,
//           status: "INITIATED",
//         },
//       });

//       // 7️⃣ Create SSL session
//       const session = await SSLCommerzService.createSession({
//         orderId: order.id,
//         amount: totalAmount,
//         customerName,
//         phone,
//       });

//       // 8️⃣ Update payment with gateway data
//       await tx.payment.update({
//         where: { id: payment.id },
//         data: {
//           transactionId: order.id,
//           sessionKey: session.sessionkey,
//           redirectUrl: session.GatewayPageURL,
//           rawResponse: session,
//           status: "PENDING",
//         },
//       });

//       return {
//         type: "REDIRECT",
//         provider: "SSLCOMMERZ",
//         redirectUrl: session.GatewayPageURL,
//         orderId: order.id,
//       };
//     }

    
//     // 🔁 BKASH FLOW (নতুন যোগ করা হয়েছে)
// if (paymentMethod === "BKASH") {
//   // ১. পেমেন্ট রেকর্ড তৈরি (INITIATED)
//   const payment = await tx.payment.create({
//     data: {
//       orderId: order.id,
//       provider: "BKASH",
//       amount: totalAmount,
//       status: "INITIATED",
//     },
//   });

//   // ২. bKash পেমেন্ট সেশন বা স্যান্ডবক্স ইউআরএল তৈরি
//   // নোট: আমরা আগে যে BkashService বানিয়েছিলাম সেটা এখানে কল হবে
//   const bkashSession = await BkashService.createBkashPayment(
//     userId,
//     order.id,
//     totalAmount
//   );

//   return {
//     type: "REDIRECT",
//     provider: "BKASH",
//     redirectUrl: bkashSession.bkashURL, // বিকাশ থেকে পাওয়া পেমেন্ট লিংক
//     orderId: order.id,
//   };
// }

//     throw new Error("Unsupported payment method");
//   });
// };





// order.service.ts

const checkoutFromCart = async (userId: string, payload: any) => {
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

  // বেসিক ভ্যালিডেশন
  if (!paymentMethod || !customerName || !phone || !addressLine1) {
    throw new Error("Missing checkout fields");
  }

  return prisma.$transaction(async (tx) => {
    // ১️⃣ ইউজার এর কার্ট লোড করা
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

    // ২️⃣ প্রোডাক্ট এর এভেইলেবিলিটি চেক করা
    for (const item of cart.items) {
      if (!item.product || !item.product.visibility) {
        throw new Error(`Product ${item.product?.name} is currently unavailable`);
      }
    }

    // ৩️⃣ সাবটোটাল এবং শিপিং ফি ক্যালকুলেশন
    const subTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const shippingFee = await getShippingFee(city as string, paymentMethod);
    const totalAmount = subTotal + shippingFee;

    // ৪️⃣ ডাটাবেসে অর্ডার তৈরি করা
    const order = await tx.order.create({
      data: {
        userId,
        paymentMethod,
        // COD হলে স্ট্যাটাস সরাসরি CONFIRMED হতে পারে, অনলাইন হলে PENDING
        status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
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
    });

    // ৫️⃣ কার্ট ক্লিয়ার করা
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    // ==========================================
    // 🔀 পেমেন্ট গেটওয়ে হ্যান্ডেলিং (BRANCHING)
    // ==========================================

    // ✅ ১. ক্যাশ অন ডেলিভারি (COD)
    if (paymentMethod === "COD") {
      return {
        type: "COD",
        message: "Order placed successfully with Cash on Delivery",
        order,
      };
    }

    // ✅ ২. বিকাশ পেমেন্ট (BKASH)
    if (paymentMethod === "BKASH") {
      // বিকাশ সেশন তৈরি করা
      const bkashData = await BkashService.createBkashPayment(
        userId,
        order.id,
        totalAmount
      );

      // পেমেন্ট রেকর্ড তৈরি
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "BKASH",
          amount: totalAmount,
          transactionId: bkashData.paymentID, // বিকাশ পেমেন্ট আইডি
          status: "PENDING",
          redirectUrl: bkashData.bkashURL,
        },
      });

      return {
        type: "REDIRECT",
        provider: "BKASH",
        redirectUrl: bkashData.bkashURL,
        orderId: order.id,
      };
    }

    // ✅ ৩. SSLCOMMERZ পেমেন্ট
    if (paymentMethod === "SSLCOMMERZ" || paymentMethod === "ONLINE") {
      // পেমেন্ট রেকর্ড তৈরি
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "SSLCOMMERZ",
          amount: totalAmount,
          status: "INITIATED",
        },
      });

      // SSL সেশন তৈরি
      const session = await SSLCommerzService.createSession({
        orderId: order.id,
        amount: totalAmount,
        customerName,
        phone,
      });

      // পেমেন্ট আপডেট
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
    }

    throw new Error("Payment method not supported");
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
