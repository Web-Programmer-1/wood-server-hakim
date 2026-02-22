import {
  InquiryStatus,
  MPaymentStatus,
  OrderStatus,
  UserRole as PrismaUserRole,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { InventoryService } from "../inventory/inventory.service";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);

const buildRevenueSeriesLast30Days = (rows: { amount: number; createdAt: Date }[]) => {
  const now = new Date();
  const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const buckets = new Map<string, number>();

  for (const p of rows) {
    const day = new Date(p.createdAt);
    if (day < start) continue;
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + p.amount);
  }

  const series: { date: string; revenue: number }[] = [];

  for (let i = 0; i < 30; i++) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    series.push({
      date: key,
      revenue: buckets.get(key) ?? 0,
    });
  }

  return series;
};

const getOverview = async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const last30DaysStart = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [
    totalMachines,
    totalProducts,
    totalOrders,
    pendingOrders,
    totalInquiries,
    openInquiries,
    totalCustomers,
    totalBlogs,
    totalEvents,
    revenueTodayAgg,
    revenueMonthAgg,
    revenueYearAgg,
    ordersByStatus,
    inquiriesByStatus,
    revenueRows,
    recentOrders,
    latestInquiries,
    topCustomersAgg,
    inventorySummary,
    lowStock,
  ] = await Promise.all([
    prisma.machine.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({
      where: { status: OrderStatus.PENDING },
    }),
    prisma.inquiry.count({
      where: { isDeleted: false },
    }),
    prisma.inquiry.count({
      where: { isDeleted: false, status: InquiryStatus.PENDING },
    }),
    prisma.user.count({
      where: { role: PrismaUserRole.CUSTOMER },
    }),
    prisma.blog.count(),
    prisma.event.count(),
    prisma.payment.aggregate({
      where: {
        status: MPaymentStatus.PAID,
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: MPaymentStatus.PAID,
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: MPaymentStatus.PAID,
        createdAt: { gte: yearStart },
      },
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.payment.findMany({
      where: {
        status: MPaymentStatus.PAID,
        createdAt: { gte: last30DaysStart },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        customerName: true,
        phone: true,
        createdAt: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        totalAmount: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.inquiry.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: 5,
    }),
    InventoryService.getInventorySummary(),
    InventoryService.getLowStockProducts(),
  ]);

  const revenueToday = revenueTodayAgg._sum.amount ?? 0;
  const revenueMonthly = revenueMonthAgg._sum.amount ?? 0;
  const revenueYearly = revenueYearAgg._sum.amount ?? 0;

  const revenueLast30Days = buildRevenueSeriesLast30Days(
    revenueRows.map((r) => ({
      amount: r.amount,
      createdAt: r.createdAt,
    }))
  );

  const ordersByStatusChart = ordersByStatus.map((o) => ({
    status: o.status,
    count: o._count._all,
  }));

  const inquiriesByStatusChart = inquiriesByStatus.map((i) => ({
    status: i.status,
    count: i._count._all,
  }));

  const customerIds = topCustomersAgg.map((c) => c.userId);

  const topCustomerUsers = customerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      })
    : [];

  const topCustomers = topCustomersAgg.map((c) => {
    const user = topCustomerUsers.find((u) => u.id === c.userId);

    return {
      id: c.userId,
      name: user?.name ?? "Unknown Customer",
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      orderCount: c._count._all,
      totalSpent: c._sum.totalAmount ?? 0,
    };
  });

  return {
    stats: {
      totalMachines,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalInquiries,
      openInquiries,
      totalCustomers,
      totalBlogs,
      totalEvents,
      revenueToday,
      revenueMonthly,
      revenueYearly,
    },
    charts: {
      revenueLast30Days,
      ordersByStatus: ordersByStatusChart,
      inquiriesByStatus: inquiriesByStatusChart,
    },
    tables: {
      latestInquiries,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customerName: o.customerName,
        email: o.user?.email ?? null,
        phone: o.phone,
        orderDate: o.createdAt,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.status,
        totalAmount: o.totalAmount,
      })),
      topCustomers,
      lowStockProducts: lowStock,
    },
    inventorySummary,
  };
};

export const AdminDashboardService = {
  getOverview,
};

