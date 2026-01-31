import { prisma } from "../../shared/prisma";
import { CouponDiscountType, Prisma } from "@prisma/client";

export const AdminCouponService = {
  create: async (payload: any) => {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      endAt,
      totalUsageLimit,
      perUserLimit,
    } = payload;

    if (
      !code ||
      !discountType ||
      !discountValue ||
      !minOrderAmount ||
      !endAt
    ) {
      throw new Error("Missing coupon fields");
    }

    return prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType: discountType as CouponDiscountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        endAt: new Date(endAt),
        totalUsageLimit,
        perUserLimit,
      },
    });
  },










getAvailableCoupons: async (userId: string) => {

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  const subTotal =
    cart?.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) ?? 0;

  const now = new Date();


  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      endAt: { gte: now },

    },
    orderBy: { createdAt: "desc" },
  });

  const availableCoupons = [];

  for (const coupon of coupons) {
    // total usage limit
    if (
      coupon.totalUsageLimit !== null &&
      coupon.usedCount >= coupon.totalUsageLimit
    ) {
      continue;
    }

    // per-user usage limit
    if (coupon.perUserLimit !== null) {
      const usedCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (usedCount >= coupon.perUserLimit) continue;
    }

    availableCoupons.push({
      id: coupon.id,
      code: coupon.code,
      title:
        coupon.discountType === "PERCENT"
          ? `${coupon.discountValue}% OFF`
          : `৳${coupon.discountValue} OFF`,
      description: `Min order ৳${coupon.minOrderAmount}`,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
    });
  }

  return availableCoupons;
},





  getAll: async (query: any) => {
    const { page = 1, limit = 10, isActive } = query;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      meta: { page: Number(page), limit: Number(limit), total },
      data,
    };
  },

  update: async (couponId: string, payload: any) => {
    return prisma.coupon.update({
      where: { id: couponId },
      data: payload,
    });
  },

  toggleStatus: async (couponId: string, isActive: boolean) => {
    return prisma.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });
  },

  remove: async (couponId: string) => {
    return prisma.coupon.delete({
      where: { id: couponId },
    });
  },
};









export const CouponPreviewService = {
  apply: async (userId: string, couponCode: string) => {
    if (!couponCode) throw new Error("Coupon code required");

    // 1️⃣ Load cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // 2️⃣ Subtotal
    const subTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 3️⃣ Coupon fetch
    const coupon = await prisma.coupon.findUnique({
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
      const used = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (used >= coupon.perUserLimit) {
        throw new Error("Coupon already used");
      }
    }

    // 4️⃣ Discount calculate
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
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      subTotal,
      discountTotal: discount,
      payableAfterDiscount: subTotal - discount,
    };
  },
};










export const getCouponUsagesForAdmin = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    search,
    couponCode,
    userId,
    fromDate,
    toDate,
    sort = "latest",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  // 🔎 WHERE condition build
  const where: any = {};

  // filter by coupon
  if (couponCode) {
    where.coupon = {
      code: { equals: couponCode, mode: "insensitive" },
    };
  }

  // filter by user
  if (userId) {
    where.userId = userId;
  }

  // date range filter
  if (fromDate || toDate) {
    where.usedAt = {};
    if (fromDate) where.usedAt.gte = new Date(fromDate);
    if (toDate) where.usedAt.lte = new Date(toDate);
  }

  // search (coupon code / user name / email)
  if (search) {
    where.OR = [
      {
        coupon: {
          code: { contains: search, mode: "insensitive" },
        },
      },
      {
        user: {
          name: { contains: search, mode: "insensitive" },
        },
      },
      {
        user: {
          email: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  // sort
  const orderBy =
    sort === "oldest"
      ? ({ usedAt: "asc" } as Prisma.CouponUsageOrderByWithRelationInput)
      : ({ usedAt: "desc" } as Prisma.CouponUsageOrderByWithRelationInput);

  // 📦 Query
  const [usages, total] = await Promise.all([
    prisma.couponUsage.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: {
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            subTotal: true,
            discountTotal: true,
            totalAmount: true,
            items: {
              select: {
                productId: true,
                productName: true,
                unitPrice: true,
                quantity: true,
                lineTotal: true,
              },
            },
          },
        },
      },
    }),

    prisma.couponUsage.count({ where }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: usages.map((u:any) => ({
      couponCode: u.coupon.code,
      discountType: u.coupon.discountType,
      discountValue: u.coupon.discountValue,
      customer: u.user,
      order: u.order,
      usedAt: u.usedAt,
    })),
  };
};







export const getCouponAnalyticsStats = async () => {
  const now = new Date();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  // 1️⃣ Total coupons
  const totalCoupons = await prisma.coupon.count();

  // 2️⃣ Active coupons
  const activeCoupons = await prisma.coupon.count({
    where: {
      isActive: true,
      endAt: { gte: now },
    },
  });

  // 3️⃣ Total coupon usages
  const totalUsages = await prisma.couponUsage.count();

  // 4️⃣ Total discount given
  const discountAgg = await prisma.order.aggregate({
    _sum: {
      discountTotal: true,
    },
    where: {
      discountTotal: { gt: 0 },
    },
  });

  const totalDiscountGiven = discountAgg._sum.discountTotal ?? 0;

  // 5️⃣ Most used coupon
  const mostUsedCoupon = await prisma.coupon.findFirst({
    orderBy: {
      usedCount: "desc",
    },
    select: {
      code: true,
      usedCount: true,
    },
  });

  // 6️⃣ Today usage
  const todayUsage = await prisma.couponUsage.count({
    where: {
      usedAt: { gte: startOfToday },
    },
  });

  // 7️⃣ This month usage
  const thisMonthUsage = await prisma.couponUsage.count({
    where: {
      usedAt: { gte: startOfMonth },
    },
  });

  return {
    totalCoupons,
    activeCoupons,
    totalUsages,
    totalDiscountGiven,
    mostUsedCoupon,
    todayUsage,
    thisMonthUsage,
  };
};
