import axios from "axios";

import qs from "qs";
import { prisma } from "../../shared/prisma";
import { MPaymentStatus, PaymentProvider } from "@prisma/client";
import { sslCommerzHttpsAgent } from "../../../utils/sandboxPermission";

type SSLSessionInput = {
  orderId: string;
  amount: number;
  customerName: string;
  phone: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  area?: string;
  note?: string;

};





const createSession = async (input: SSLSessionInput) => {
  const payload = {
    // 🔐 Store credentials
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD!,

    // 💰 Transaction
    total_amount: input.amount,
    currency: "BDT",
    tran_id: input.orderId,

    // 🔁 Redirect URLs
    success_url: process.env.SSLCOMMERZ_SUCCESS_URL!,
    fail_url: process.env.SSLCOMMERZ_FAIL_URL!,
    cancel_url: process.env.SSLCOMMERZ_CANCEL_URL!,
    ipn_url: process.env.SSLCOMMERZ_IPN_URL!,

    // 👤 Customer info (MANDATORY)
    cus_name: input.customerName,
    cus_email: input.email || "test@example.com",
    cus_phone: input.phone,
    cus_add1: input.addressLine1 || "N/A",      // ✅ MUST
    cus_city: input.city || "Dhaka",             // ✅ MUST
    cus_country: "Bangladesh",                   // ✅ MUST

    // 📦 Product info
    product_name: "Order Payment",
    product_category: "Ecommerce",
    product_profile: "general",

    // 🚚 Shipping
    shipping_method: "NO",
  };

  const res = await axios.post(
    process.env.SSLCOMMERZ_SESSION_URL!,
    qs.stringify(payload),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      httpsAgent: sslCommerzHttpsAgent,
    }
  );

  // 🔴 Defensive check
  if (!res.data?.GatewayPageURL) {
    console.error("SSLCOMMERZ ERROR:", res.data);
    throw new Error(res.data?.failedreason || "SSLCommerz session failed");
  }

  return res.data;
};









const handleSuccess = async (body: any) => {
  const { tran_id, val_id, amount } = body;

  const validationRes = await axios.get(
    `${process.env.SSLCOMMERZ_VALIDATION_URL!}?val_id=${val_id}&store_id=${
      process.env.SSLCOMMERZ_STORE_ID
    }&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&format=json`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      httpsAgent: sslCommerzHttpsAgent,
    }
  );

  if (validationRes.data.status !== "VALID") {
    throw new Error("SSL validation failed");
  }

  // 2️⃣ update payment
  await prisma.payment.updateMany({
    where: { orderId: tran_id, provider: "SSLCOMMERZ" },
    data: {
      status: "PAID",
      gatewayRef: val_id,
      rawResponse: validationRes.data,
    },
  });

  await prisma.order.update({
    where: { id: tran_id },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
    },
  });

  return true;
};

const handleFail = async (body: any) => {
  const { tran_id } = body;

  await prisma.payment.updateMany({
    where: { orderId: tran_id, provider: "SSLCOMMERZ" },
    data: { status: MPaymentStatus.FAILED, rawResponse: body },
  });
};

const handleCancel = async (body: any) => {
  const { tran_id } = body;

  await prisma.payment.updateMany({
    where: { orderId: tran_id, provider: "SSLCOMMERZ" },
    data: { status: MPaymentStatus.FAILED, rawResponse: body },
  });

  await prisma.order.update({
    where: { id: tran_id },
    data: { status: "CANCELLED" },
  });
};

const handleIpn = async (body: any) => {
  const { tran_id, val_id, amount } = body;

  if (!tran_id || !val_id) {
    throw new Error("Invalid IPN payload");
  }

  // 1️⃣ Find payment
  const payment = await prisma.payment.findFirst({
    where: {
      orderId: tran_id,
      provider: "SSLCOMMERZ",
    },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  // 🔁 Idempotency check (VERY IMPORTANT)
  if (payment.status === MPaymentStatus.PAID) {
    return true; // already processed
  }

  // 2️⃣ Call SSLCOMMERZ validation API
  const validationRes = await axios.get(
    `${process.env.SSLCOMMERZ_VALIDATION_URL!}?val_id=${val_id}&store_id=${
      process.env.SSLCOMMERZ_STORE_ID
    }&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&format=json`,
    {
      httpsAgent: sslCommerzHttpsAgent,
    }
  );

  const validation = validationRes.data;

  // 3️⃣ Validate response
  if (validation.status !== "VALID") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: MPaymentStatus.FAILED,
        rawResponse: validation,
      },
    });
    throw new Error("Payment validation failed");
  }

  // 4️⃣ Amount check (fraud protection)
  if (Number(validation.amount) !== payment.amount) {
    throw new Error("Amount mismatch detected");
  }

  // 5️⃣ Transaction (Payment + Order)
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: MPaymentStatus.PAID,
        gatewayRef: val_id,
        rawResponse: validation,
      },
    });

    await tx.order.update({
      where: { id: tran_id },
      data: {
        status: "CONFIRMED",
      },
    });
  });

  return true;
};

// -----------------------CUSTOMAR Dashboard Api ------------------------------------------------



type GetMyPaymentsParams = {
  page?: number;
  limit?: number;
  status?: MPaymentStatus;
  provider?: PaymentProvider;
  from?: string;
  to?: string;
};

const getMyPayments = async (userId: string, params: GetMyPaymentsParams) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = {
    order: {
      userId,
    },
  };


  if (params.status) {
    where.status = params.status;
  }


  if (params.provider) {
    where.provider = params.provider;
  }


  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) {
      where.createdAt.gte = new Date(params.from);
    }
    if (params.to) {
      where.createdAt.lte = new Date(params.to);
    }
  }

  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
   
        id: true,
        provider: true,
        status: true,
        amount: true,
        createdAt: true,

    
        order: {
          select: {
            id: true,
            status: true,
            customerName: true,
            items: {
              select: {
                productName: true,
                quantity: true,
                unitPrice: true,

                product: {
                  select: {
                    images: {
                      select: {
                    imageUrl:true,
                    isPrimary:true,
                      },
                      take: 1, 
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.payment.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};


const getPaymentByOrder = async (userId: string, orderId: string) => {

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      status: true,
      customerName: true,

      items: {
        select: {
          productName: true,
          product:{
            select:{
              images:{
                select:{
                  imageUrl:true,
                  isPrimary:true,
                }
              }
            }
          },
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // 2️⃣ Get latest payment for this order
  const payment = await prisma.payment.findFirst({
    where: {
      orderId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      provider: true,
      status: true,
      amount: true,
      createdAt: true,
    },
  });

  return {
    order,
    payment,
  };
};








const retryPayment = async (userId: string, orderId: string) => {
  // 1️⃣ Validate order ownership
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    throw new Error("Payment retry not allowed for this order");
  }

  // 2️⃣ Check latest payment
  const lastPayment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  if (lastPayment?.status === "PAID") {
    throw new Error("Payment already completed");
  }

  // 3️⃣ Create new payment record
  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider: "SSLCOMMERZ",
      amount: order.totalAmount,
      status: "INITIATED",
    },
  });

  // 4️⃣ Create SSLCOMMERZ session
  const session = await SSLCommerzService.createSession({
    orderId: order.id,
    amount: order.totalAmount,
    customerName: order.customerName,
    phone: order.phone,
  });

  // 5️⃣ Update payment with session info
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      transactionId: order.id,
      sessionKey: session.sessionkey,
      redirectUrl: session.GatewayPageURL,
      rawResponse: session,
      status: "PENDING",
    },
  });

  return {
    orderId: order.id,
    paymentId: payment.id,
    redirectUrl: session.GatewayPageURL,
  };
};




export const SSLCommerzService = {
  createSession,
  handleSuccess,
  handleFail,
  handleCancel,
  handleIpn,
  getMyPayments,
  getPaymentByOrder,
  retryPayment,
};
