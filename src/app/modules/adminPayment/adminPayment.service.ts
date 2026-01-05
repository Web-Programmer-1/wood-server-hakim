// services/admin.payment.service.ts
import { MPaymentStatus, OrderStatus, PaymentProvider } from "@prisma/client";
import { prisma } from "../../shared/prisma";

 const getPayments = async (query: any) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  // 🔹 filter: provider
  if (query.provider) {
    where.provider = query.provider;
  }

  // 🔹 filter: status
  if (query.status) {
    where.status = query.status;
  }

  // 🔹 filter: date range
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
            totalAmount: true,
            customerName: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },

            items: {
              select: {
                productName: true,
                quantity: true,
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






const getAdminPaymentDetails = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            select: {
              productId: true,
              productName: true,
              productSlug: true,
              unitPrice: true,
              quantity: true,
              lineTotal: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};





const getPaymentsByOrderIdAdmin = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          transactionId: true,
          gatewayRef: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return {
    order: {
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    },
    payments: order.payments,
  };
};








const markPaymentFailed = async (
  paymentId: string,
  adminId: string,
  reason?: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status === MPaymentStatus.PAID) {
    throw new Error("PAID payment cannot be marked as FAILED");
  }


  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });


  const previousRawResponse =
  typeof payment.rawResponse === "object" && payment.rawResponse !== null
    ? payment.rawResponse
    : {};


  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: MPaymentStatus.FAILED,
      rawResponse: {
        ...previousRawResponse,
        adminAction: {
          action: "MARK_FAILED",
          reason: reason || "Marked failed by admin",
          admin: {
            id: admin?.id,
            name: admin?.name,
            email: admin?.email,
            phone: admin?.phone,
          },
          at: new Date().toISOString(),
        },
      },
    },
  });

  return updatedPayment;
};




const markPaymentPaid = async (
  paymentId: string,
  adminId: string,
  reason?: string
) => {

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }


  if (payment.status === MPaymentStatus.PAID) {
    return payment;
  }


  if (payment.status === MPaymentStatus.REFUNDED) {
    throw new Error("Refunded payment cannot be marked as PAID");
  }

  // 2️⃣ Get admin info
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  // 3️⃣ Transaction: Payment + Order
  const updatedPayment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: MPaymentStatus.PAID,
        rawResponse: {
          ...(typeof payment.rawResponse === "object"
            ? payment.rawResponse
            : {}),
          adminAction: {
            action: "MARK_PAID",
            reason: reason || "Marked paid manually by admin",
            at: new Date(),
            admin,
          },
        },
      },
    });

  
    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "PAID",
        status: OrderStatus.CONFIRMED,
      },
    });

    return updated;
  });

  return updatedPayment;
};














type SummaryParams = { from?: string; to?: string };

const toDateOrNull = (v?: string) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const getFailedReason = (raw: any) => {
  // 1) adminAction.reason থাকলে সেটাই
  const adminReason = raw?.adminAction?.reason;
  if (typeof adminReason === "string" && adminReason.trim()) return adminReason.trim();

  // 2) gateway error থাকলে সেটাই
  const err = raw?.error;
  if (typeof err === "string" && err.trim()) return err.trim();

  // 3) fallback
  return "UNKNOWN";
};

const getPaymentsSummary = async (params: SummaryParams) => {
  // default: last 30 days (production-friendly)
  const now = new Date();
  const fromDate =
    toDateOrNull(params.from) ?? startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  const toDate = toDateOrNull(params.to) ?? endOfDay(now);

  const whereRange = {
    createdAt: {
      gte: fromDate,
      lte: toDate,
    },
  } as const;

  // ---------- 1) Status group (count + sum) ----------
  const byStatus = await prisma.payment.groupBy({
    by: ["status"],
    where: whereRange,
    _count: { _all: true },
    _sum: { amount: true },
  });

  const statusCount = (s: MPaymentStatus) =>
    byStatus.find((x) => x.status === s)?._count._all ?? 0;

  const statusAmount = (s: MPaymentStatus) =>
    byStatus.find((x) => x.status === s)?._sum.amount ?? 0;

  const totalCount = byStatus.reduce((a, x) => a + x._count._all, 0);

  const paidCount = statusCount(MPaymentStatus.PAID);
  const pendingCount = statusCount(MPaymentStatus.PENDING);
  const failedCount = statusCount(MPaymentStatus.FAILED);
  const refundedCount = statusCount(MPaymentStatus.REFUNDED);
  const initiatedCount = statusCount(MPaymentStatus.INITIATED);

  const paidAmount = statusAmount(MPaymentStatus.PAID);
  const pendingAmount = statusAmount(MPaymentStatus.PENDING);
  const failedAmount = statusAmount(MPaymentStatus.FAILED);
  const refundedAmount = statusAmount(MPaymentStatus.REFUNDED);
  const initiatedAmount = statusAmount(MPaymentStatus.INITIATED);

  // ---------- 2) Provider breakdown ----------
  const byProvider = await prisma.payment.groupBy({
    by: ["provider"],
    where: whereRange,
    _count: { _all: true },
    _sum: { amount: true },
  });

  const providers: PaymentProvider[] = [
    PaymentProvider.SSLCOMMERZ,
    PaymentProvider.BKASH,
    PaymentProvider.COD,
  ];

  const methodCounts: Record<string, number> = {};
  const methodAmounts: Record<string, number> = {};

  for (const p of providers) {
    methodCounts[p] = byProvider.find((x) => x.provider === p)?._count._all ?? 0;
    methodAmounts[p] = byProvider.find((x) => x.provider === p)?._sum.amount ?? 0;
  }

  // Provider success rate: total vs paid
  const providerPaid = await prisma.payment.groupBy({
    by: ["provider"],
    where: { ...whereRange, status: MPaymentStatus.PAID },
    _count: { _all: true },
  });

  const successRateByProvider: Record<
    string,
    { paidCount: number; totalCount: number; successRate: number }
  > = {};

  for (const p of providers) {
    const total = methodCounts[p] ?? 0;
    const paid = providerPaid.find((x) => x.provider === p)?._count._all ?? 0;
    successRateByProvider[p] = {
      paidCount: paid,
      totalCount: total,
      successRate: total > 0 ? Number(((paid / total) * 100).toFixed(2)) : 0,
    };
  }

  // ---------- 3) Time-based revenue ----------
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yStart = startOfDay(yesterday);
  const yEnd = endOfDay(yesterday);

  const mStart = startOfMonth(now);

  const [todayPaidAgg, yesterdayPaidAgg, thisMonthPaidAgg] =
    await prisma.$transaction([
      prisma.payment.aggregate({
        where: { status: MPaymentStatus.PAID, createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: MPaymentStatus.PAID, createdAt: { gte: yStart, lte: yEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: MPaymentStatus.PAID, createdAt: { gte: mStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
    ]);

  const todayPaid = todayPaidAgg._sum.amount ?? 0;
  const yesterdayPaid = yesterdayPaidAgg._sum.amount ?? 0;
  const thisMonthPaid = thisMonthPaidAgg._sum.amount ?? 0;

  // ---------- 4) Success rate overall ----------
  const successRate =
    totalCount > 0 ? Number(((paidCount / totalCount) * 100).toFixed(2)) : 0;

  // ---------- 5) Top failed reasons + manual actions + peak hour ----------
  // (range-এর মধ্যে select কম ফিল্ড নিয়ে JS-এ গণনা)
  const minimalForAnalysis = await prisma.payment.findMany({
    where: whereRange,
    select: {
      status: true,
      provider: true,
      createdAt: true,
      rawResponse: true,
    },
  });

  // Top failed reasons
  const reasonMap = new Map<string, number>();
  for (const p of minimalForAnalysis) {
    if (p.status !== MPaymentStatus.FAILED) continue;
    const r = getFailedReason(p.rawResponse);
    reasonMap.set(r, (reasonMap.get(r) ?? 0) + 1);
  }
  const topFailedReasons = Array.from(reasonMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  // Manual actions
  let manualMarkPaidCount = 0;
  let manualMarkFailedCount = 0;
  for (const p of minimalForAnalysis) {
    const action = (p.rawResponse as any)?.adminAction?.action;
    if (action === "MARK_PAID") manualMarkPaidCount++;
    if (action === "MARK_FAILED") manualMarkFailedCount++;
  }

  // Peak payment hour (সব status মিলিয়ে count)
  const hourCounts = new Array(24).fill(0);
  for (const p of minimalForAnalysis) {
    const h = new Date(p.createdAt).getHours();
    hourCounts[h] += 1;
  }
  let peakHour = 0;
  for (let i = 1; i < 24; i++) {
    if (hourCounts[i] > hourCounts[peakHour]) peakHour = i;
  }
  const mostPaymentsAtHour = `${String(peakHour).padStart(2, "0")}:00-${String(
    peakHour
  ).padStart(2, "0")}:59`;

  // ---------- 6) Collection & lav/khoti view ----------
  const grossPaidAmount = paidAmount;
  const netCollectedAmount = grossPaidAmount - refundedAmount;

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },

    collection: {
      grossPaidAmount,
      refundedAmount,
      netCollectedAmount,
    },

    counts: {
      totalCount,
      paidCount,
      pendingCount,
      failedCount,
      refundedCount,
      initiatedCount,
    },

    amountsByStatus: {
      paidAmount,
      pendingAmount,
      failedAmount,
      refundedAmount,
      initiatedAmount,
    },

    methods: {
      methodCounts,
      methodAmounts,
    },

    timeRevenue: {
      todayPaid,
      yesterdayPaid,
      thisMonthPaid,
    },

    rates: {
      successRate,
      successRateByProvider,
    },

    failures: {
      topFailedReasons,
    },

    behavior: {
      averagePaymentAmount: paidCount > 0 ? Number((paidAmount / paidCount).toFixed(2)) : 0,
      mostPaymentsAtHour,
    },

    risk: {
      pendingExposureCount: pendingCount,
      pendingExposureAmount: pendingAmount,
    },

    manualActions: {
      manualMarkPaidCount,
      manualMarkFailedCount,
    },

    funnel: {
      initiatedCount,
      paidCount,
      failedCount,
    },

    lavKhotiView: {
      lavNetCollected: netCollectedAmount,
      khotiRefundImpact: refundedAmount,
      khotiFailedDropoff: failedAmount,
      riskPendingExposure: pendingAmount,
    },
  };
};














const pickGatewayFields = (raw: any) => {
  if (!raw || typeof raw !== "object") return null;

  // 🔐 remove sensitive fields if present
  const sanitized = { ...raw };
  delete sanitized.store_passwd;
  delete sanitized.pass;
  delete sanitized.verify_sign;
  delete sanitized.verify_sign_sha2;

  // return a compact gateway view (admin dashboard friendly)
  return {
    status: sanitized.status ?? null,
    error: sanitized.error ?? null,
    bank_tran_id: sanitized.bank_tran_id ?? null,
    card_issuer: sanitized.card_issuer ?? null,
    card_brand: sanitized.card_brand ?? null,
    tran_date: sanitized.tran_date ?? null,
    currency: sanitized.currency ?? null,
    currency_amount: sanitized.currency_amount ?? null,

    // keep full sanitized payload (optional) for deep debug
    raw: sanitized,
  };
};

const buildTimeline = (payment: any) => {
  const timeline: Array<{ event: string; at: string; meta?: any }> = [];

  // Payment created
  timeline.push({
    event: "PAYMENT_CREATED",
    at: new Date(payment.createdAt).toISOString(),
    meta: { status: "INITIATED" },
  });

  // Status snapshot (current)
  timeline.push({
    event: "PAYMENT_STATUS_SNAPSHOT",
    at: new Date(payment.updatedAt).toISOString(),
    meta: { status: payment.status },
  });

  // Admin action (if any)
  const adminAction = (payment.rawResponse as any)?.adminAction;
  if (adminAction?.action && adminAction?.at) {
    timeline.push({
      event: adminAction.action, // MARK_PAID / MARK_FAILED
      at: new Date(adminAction.at).toISOString(),
      meta: {
        reason: adminAction.reason ?? null,
        admin: adminAction.admin ?? null,
      },
    });
  }

  // Gateway callback clue (if gateway status present)
  const gatewayStatus = (payment.rawResponse as any)?.status;
  if (gatewayStatus) {
    timeline.push({
      event: "GATEWAY_STATUS_RECORDED",
      at: new Date(payment.updatedAt).toISOString(),
      meta: { gatewayStatus },
    });
  }

  // Sort by time
  timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return timeline;
};

const getPaymentAudit = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: {
            select: {
              productId: true,
              productName: true,
              productSlug: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  // যদি ProductImage relation থাকে, এখানে add করো:
                  // images: { select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) throw new Error("Payment not found");

  // rawResponse might be string/array/null → safe object
  const raw = payment.rawResponse;
  const rawObj = raw && typeof raw === "object" ? raw : {};

  const adminAction = (rawObj as any)?.adminAction ?? null;
  const gateway = pickGatewayFields(rawObj);

  const timeline = buildTimeline({
    ...payment,
    rawResponse: rawObj,
  });

  // Admin audit view
  return {
    payment: {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      gatewayRef: payment.gatewayRef,
      sessionKey: payment.sessionKey,
      redirectUrl: payment.redirectUrl,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    },

    order: {
      id: payment.order.id,
      status: payment.order.status,
      paymentMethod: payment.order.paymentMethod,
      paymentStatus: payment.order.paymentStatus,
      totalAmount: payment.order.totalAmount,
      customerName: payment.order.customerName,
      phone: payment.order.phone,
      city: payment.order.city,
      area: payment.order.area,
      user: payment.order.user, // customer info
      items: payment.order.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        productSlug: it.productSlug,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        // image দেখাতে চাইলে product.images থেকে map করবে (যদি schema থাকে)
      })),
    },

    audit: {
      gateway,
      adminAction,
      // rawRequest rawResponse full sanitize (optional)
      rawRequest: payment.rawRequest ?? null,
      rawResponseSanitized: gateway?.raw ?? rawObj,
    },

    timeline,
  };
};












export const AdminPaymentService = {
  getPayments,
  getAdminPaymentDetails,
  getPaymentsByOrderIdAdmin,
  markPaymentFailed,
  markPaymentPaid,
  getPaymentsSummary,
  getPaymentAudit
}