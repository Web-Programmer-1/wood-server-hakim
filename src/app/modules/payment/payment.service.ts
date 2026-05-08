import axios from "axios";
import crypto from "crypto";

import qs from "qs";
import { prisma } from "../../shared/prisma";
import {
  MPaymentStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { sslCommerzHttpsAgent } from "../../../utils/sandboxPermission";

// SSLCommerz signs IPN/success bodies with MD5(verify_sign).
// Algorithm (per SSLCommerz docs):
//   1. Read field names from `verify_key` (comma-separated).
//   2. Collect those fields' raw values from the body.
//   3. Add `store_passwd = md5(STORE_PASSWORD)`.
//   4. Sort the resulting pairs by key, ascending.
//   5. Join as `k1=v1&k2=v2&...` and MD5-hash.
//   6. Compare against `verify_sign` (constant-time).
const verifySslCommerzSignature = (body: any): boolean => {
  const verifySign = body?.verify_sign;
  const verifyKey = body?.verify_key;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (
    typeof verifySign !== "string" ||
    typeof verifyKey !== "string" ||
    !storePassword
  ) {
    return false;
  }

  const fields: Record<string, string> = {};
  for (const key of verifyKey.split(",")) {
    const trimmed = key.trim();
    if (!trimmed) continue;
    const value = body[trimmed];
    fields[trimmed] = value === undefined || value === null ? "" : String(value);
  }
  fields.store_passwd = crypto
    .createHash("md5")
    .update(storePassword)
    .digest("hex");

  const hashString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("&");

  const computed = crypto.createHash("md5").update(hashString).digest("hex");

  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(verifySign, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

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
    cus_add1: input.addressLine1 || "N/A", // ✅ MUST
    cus_city: input.city || "Dhaka", // ✅ MUST
    cus_country: "Bangladesh", // ✅ MUST

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
    },
  );

  // 🔴 Defensive check
  if (!res.data?.GatewayPageURL) {
    console.error("SSLCOMMERZ ERROR:", res.data);
    throw new Error(res.data?.failedreason || "SSLCommerz session failed");
  }

  return res.data;
};

const handleSuccess = async (body: any) => {
  if (!verifySslCommerzSignature(body)) {
    throw new Error("Invalid SSLCommerz signature");
  }

  const { tran_id, val_id, amount } = body;

  const validationRes = await axios.get(
    `${process.env.SSLCOMMERZ_VALIDATION_URL!}?val_id=${val_id}&store_id=${
      process.env.SSLCOMMERZ_STORE_ID
    }&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&format=json`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      httpsAgent: sslCommerzHttpsAgent,
    },
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

// const getReceiptByTranId = async (tranId: string) => {
//   const payment = await prisma.payment.findFirst({
//    where: { orderId: tranId, provider: "SSLCOMMERZ" },
//   orderBy: { createdAt: "desc" },
//     include: {
//       order: {
//         select: {
//           id: true,

//           user:{
//             select:{
//               email:true,
//               name:true,
//               phone:true,
//               profile: {
//                 select: {
//                   avatarUri: true,
//                   gender: true,
//                   profession: true,
//                   occupationType: true,
//                   bio: true,
//                 },
//               },

//             }
//           },
//           addressLine1: true,
//           city: true,
//           area: true,

//           totalAmount: true,
//           status: true,
//           createdAt: true,
//         },
//       },
//     },
//   });

//   if (!payment) throw new Error("Receipt not found");

//   const raw: any = payment.rawResponse || {}; // validationRes.data (তুমি save করছো)

//   return {
//     orderId: payment.orderId,
//     invoiceNo: raw?.invoice_no || null,
//     transactionId: payment.gatewayRef || raw?.bank_tran_id || null,
//     paymentMethod: raw?.card_type || raw?.card_issuer || raw?.payment_type || "SSLCOMMERZ",
//     amount: payment.amount,
//     currency: raw?.currency || "BDT",
//     paidAt: payment.updatedAt,
//     status: payment.status,

//     order: {
//       id: payment.order.id,
//       user: payment.order.user.email,
//       addressLine1: payment.order.addressLine1,
//       city: payment.order.city,
//       area: payment.order.area,
//       totalAmount: payment.order.totalAmount,
//       status: payment.order.status,
//       createdAt: payment.order.createdAt,
//     },
//   };
// };

const getReceiptByTranId = async (tranId: string) => {
  const include = {
    order: {
      select: {
        id: true,
        user: {
          select: {
            email: true,
            name: true,
            phone: true,
          },
        },

        addressLine1: true,
        city: true,
        area: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    },
  };

  // ✅ 1) Prefer PAID
  let payment = await prisma.payment.findFirst({
    where: { orderId: tranId, provider: "SSLCOMMERZ", status: "PAID" },
    orderBy: { updatedAt: "desc" },
    include,
  });

  // ✅ 2) fallback latest
  if (!payment) {
    payment = await prisma.payment.findFirst({
      where: { orderId: tranId, provider: "SSLCOMMERZ" },
      orderBy: { updatedAt: "desc" },
      include,
    });
  }

  if (!payment) throw new Error("Receipt not found");

  const raw: any = payment.rawResponse || {};

  return {
    orderId: payment.orderId,

    invoiceNo:
      raw?.invoice_no || `INV-${payment.orderId.slice(0, 8).toUpperCase()}`,
    transactionId: payment.gatewayRef || raw?.bank_tran_id || null,
    paymentMethod:
      raw?.card_type || raw?.card_issuer || raw?.payment_type || "SSLCOMMERZ",
    amount: payment.amount,
    currency: raw?.currency || "BDT",
    paidAt: payment.updatedAt,
    status: payment.status,

    order: {
      name: payment.order.user.email,
      phone: payment.order.user.phone,

      status: payment.order.status,
      createdAt: payment.order.createdAt,
    },
  };
};
// Comment
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
  if (!verifySslCommerzSignature(body)) {
    throw new Error("Invalid SSLCommerz signature");
  }

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
    },
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
                        imageUrl: true,
                        isPrimary: true,
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
          product: {
            select: {
              images: {
                select: {
                  imageUrl: true,
                  isPrimary: true,
                },
              },
            },
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

type ManualUpdateInput = {
  paymentId: string;
  status: MPaymentStatus; // Payment table enum
  note?: string;
  updatedBy: string; // adminId
};

const mapPaymentToOrderPaymentStatus = (p: MPaymentStatus): PaymentStatus => {
  // MPaymentStatus: INITIATED | PENDING | PAID | FAILED | REFUNDED
  // Order PaymentStatus: INITIATED | PENDING | PAID | UNPAID | FAILED | REFUNDED
  switch (p) {
    case MPaymentStatus.INITIATED:
      return PaymentStatus.INITIATED;
    case MPaymentStatus.PENDING:
      return PaymentStatus.PENDING;
    case MPaymentStatus.PAID:
      return PaymentStatus.PAID;
    case MPaymentStatus.FAILED:
      return PaymentStatus.FAILED;
    case MPaymentStatus.REFUNDED:
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.UNPAID;
  }
};

// Basic transition rules (তুমি চাইলে আরও strict করতে পারো)
const canTransition = (from: MPaymentStatus, to: MPaymentStatus) => {
  if (from === to) return true;

  // already paid -> initiated/pending/failed disallow
  if (
    from === MPaymentStatus.PAID &&
    (to === MPaymentStatus.INITIATED ||
      to === MPaymentStatus.PENDING ||
      to === MPaymentStatus.FAILED)
  )
    return false;

  // refunded -> paid disallow
  if (from === MPaymentStatus.REFUNDED && to === MPaymentStatus.PAID)
    return false;

  return true;
};

const updatePaymentStatusManual = async (input: ManualUpdateInput) => {
  const { paymentId, status: newStatus, note, updatedBy } = input;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) throw new Error("Payment not found");

  // (Optional) only SSLCOMMERZ
  if (payment.provider !== PaymentProvider.SSLCOMMERZ) {
    throw new Error("Only SSLCOMMERZ payment can be updated here");
  }

  // Order guards
  if (payment.order.status === OrderStatus.CANCELLED) {
    throw new Error("Order is cancelled. Payment update not allowed.");
  }
  if (
    payment.order.status === OrderStatus.DELIVERED &&
    newStatus !== MPaymentStatus.REFUNDED
  ) {
    throw new Error("Order already delivered. Only REFUNDED is allowed.");
  }

  // Transition guard
  if (!canTransition(payment.status, newStatus)) {
    throw new Error(`Invalid transition: ${payment.status} -> ${newStatus}`);
  }

  const orderPaymentStatus = mapPaymentToOrderPaymentStatus(newStatus);

  // Order status update policy
  // - payment PAID => order CONFIRMED (যদি এখনো PENDING থাকে)
  // - payment FAILED => order paymentStatus FAILED (order status untouched)
  // - payment REFUNDED => order paymentStatus REFUNDED (order status untouched)
  const orderUpdate: any = {
    paymentStatus: orderPaymentStatus,
  };

  if (newStatus === MPaymentStatus.PAID) {
    // PENDING থাকলে CONFIRMED করে দাও
    if (payment.order.status === OrderStatus.PENDING) {
      orderUpdate.status = OrderStatus.CONFIRMED;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        rawResponse: {
          ...(payment.rawResponse as any),
          manualUpdate: {
            status: newStatus,
            note: note || null,
            updatedBy,
            updatedAt: new Date().toISOString(),
          },
        },
      },
      select: {
        id: true,
        orderId: true,
        provider: true,
        status: true,
        amount: true,
        updatedAt: true,
      },
    });

    const updatedOrder = await tx.order.update({
      where: { id: payment.orderId },
      data: orderUpdate,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
      },
    });

    return { updatedPayment, updatedOrder };
  });

  return result;
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
  updatePaymentStatusManual,
  getReceiptByTranId,
};
