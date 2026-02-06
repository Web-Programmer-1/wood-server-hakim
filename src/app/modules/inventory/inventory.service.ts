import { prisma } from "../../shared/prisma";
import { generateUniqueSKU, generateUniqueSlug } from "./dynamicSlugSku";
import { InventoryListQuery } from "./inventory.interface";

type ServiceErrorOpts = { statusCode: number; errorCode: string };
class ServiceError extends Error {
  statusCode: number;
  errorCode: string;
  constructor(message: string, opts: ServiceErrorOpts) {
    super(message);
    this.statusCode = opts.statusCode;
    this.errorCode = opts.errorCode;
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export class InventoryService {
  static async getDashboard() {
    // Validation (simple)
    // এখানে request body নেই, তাই শুধু safe compute.

    const [totalProducts, inStock, lowStock, outOfStock] = await Promise.all([
      prisma.product.count({ where: { visibility: true } }).catch(() => 0),
      prisma.productInventory.count({ where: { status: "IN_STOCK" as any } }).catch(() => 0),
      prisma.productInventory.count({ where: { status: "LOW_STOCK" as any } }).catch(() => 0),
      prisma.productInventory.count({ where: { status: "OUT_OF_STOCK" as any } }).catch(() => 0),
    ]);

    const todayFrom = startOfToday();
    const todayTo = endOfToday();

    // Today movement sums (IN & OUT)
    const [todayInAgg, todayOutAgg] = await Promise.all([
      prisma.stockMovement.aggregate({
        _sum: { quantity: true },
        where: {
          type: "IN" as any,
          createdAt: { gte: todayFrom, lte: todayTo },
        },
      }),
      prisma.stockMovement.aggregate({
        _sum: { quantity: true },
        where: {
          type: "OUT" as any,
          createdAt: { gte: todayFrom, lte: todayTo },
        },
      }),
    ]);

    const stockIn = Number(todayInAgg?._sum?.quantity || 0);
    // OUT সাধারণত positive quantity store করলেও UI তে “removed” দেখাবে,
    // তাই absolute count দেখানো better
    const stockOut = Math.abs(Number(todayOutAgg?._sum?.quantity || 0));

    // Recent low-stock preview list
    const recentAlerts = await prisma.productInventory.findMany({
      where: {
        OR: [{ status: "LOW_STOCK" as any }, { status: "OUT_OF_STOCK" as any }],
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        productId: true,
        sku: true,
        availableQty: true,
        reorderLevel: true,
        status: true,
        product: { select: { name: true } },
      },
    });

    return {
      summary: {
        totalProducts,
        inStock,
        lowStock,
        outOfStock,
      },
      today: { stockIn, stockOut },
      recentAlerts: recentAlerts.map((x) => ({
        productId: x.productId,
        name: x.product?.name ?? "Unknown",
        sku: x.sku,
        availableQty: x.availableQty,
        reorderLevel: x.reorderLevel,
        status: x.status,
      })),
    };
  };






   static async getInventoryList(query: InventoryListQuery) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Status filter
    if (query.status && query.status !== "ALL") {
      where.status = query.status;
    }

    // Search by product name or SKU
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: "insensitive" } },
        {
          product: {
            name: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    const [items, totalItems] = await Promise.all([
      prisma.productInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          productId: true,
          sku: true,
          availableQty: true,
          reservedQty: true,
          damagedQty: true,
          reorderLevel: true,
          status: true,
          
          product: {
            
            select: {
              name: true,
              productCategory: { select: {
                 name: true,
      
                
                } },
            },
          },
        },
      }),
      prisma.productInventory.count({ where }),
    ]);

    return {
      items: items.map((x) => ({
        productId: x.productId,
        name: x.product.name,
        category: x.product.productCategory.name,
        sku: x.sku,
        availableQty: x.availableQty,
        reservedQty: x.reservedQty,
        damagedQty: x.damagedQty,
        status: x.status,
        reorderLevel: x.reorderLevel,
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  static async exportInventoryCSV() {
    const rows = await prisma.productInventory.findMany({
      select: {
        sku: true,
        availableQty: true,
        reservedQty: true,
        damagedQty: true,
        reorderLevel: true,
        status: true,
        product: { select: { name: true } },
      },
    });

    const header =
      "Product Name,SKU,Available,Reserved,Damaged,Reorder Level,Status\n";

    const body = rows
      .map(
        (r) =>
          `${r.product.name},${r.sku},${r.availableQty},${r.reservedQty},${r.damagedQty},${r.reorderLevel},${r.status}`
      )
      .join("\n");

    return header + body;
  }










  static async getInventoryDetails(productId: string) {
    // Basic validation
    const inventory = await prisma.productInventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            name: true,
            productCategory: { select: { name: true } },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new Error("Inventory not found for this product");
    }

    // Last stock IN
    const lastStockIn = await prisma.stockMovement.findFirst({
      where: { productId, type: "IN" as any },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Last stock OUT
    const lastStockOut = await prisma.stockMovement.findFirst({
      where: { productId, type: "OUT" as any },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const totalQty =
      inventory.availableQty +
      inventory.reservedQty +
      inventory.damagedQty;

    const healthPercent =
      inventory.reorderLevel > 0
        ? Math.min(
            100,
            Math.round(
              (inventory.availableQty / inventory.reorderLevel) * 100
            )
          )
        : 100;

    const totalInventoryValue =
      (inventory.averageCost || inventory.costPrice || 0) *
      inventory.availableQty;

    return {
      productInfo: {
        productId,
        name: inventory.product.name,
        sku: inventory.sku,
        category: inventory.product.productCategory.name,
        status: inventory.status,
      },
      stock: {
        availableQty: inventory.availableQty,
        reservedQty: inventory.reservedQty,
        damagedQty: inventory.damagedQty,
        totalQty,
        reorderLevel: inventory.reorderLevel,
        healthPercent,
      },
      pricing: {
        costPrice: inventory.costPrice || 0,
        averageCost: inventory.averageCost || inventory.costPrice || 0,
        totalInventoryValue,
      },
      timeline: {
        createdAt: inventory.product.createdAt,
        lastUpdated: inventory.updatedAt,
        lastStockIn: lastStockIn?.createdAt || null,
        lastStockOut: lastStockOut?.createdAt || null,
      },
    };
  }




  static async getMovementHistory(productId: string, limit: number) {
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      type: true,
      quantity: true,
      previousQty: true,
      currentQty: true,
      reason: true,
      referenceId: true,
      createdAt: true,
    },
  });
}











static async createMovement(payload: {
  productId: string;
  type: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
}) {
  const { productId, type, quantity, reason, referenceId } = payload;

  if (!productId || !type || !quantity || quantity <= 0) {
    throw {
      statusCode: 400,
      errorCode: "INVALID_INPUT",
      message: "Product, type and positive quantity are required",
    };
  }

  const inventory = await prisma.productInventory.findUnique({
    where: { productId },
  });

  if (!inventory) {
    throw {
      statusCode: 404,
      errorCode: "INVENTORY_NOT_FOUND",
      message: "Inventory not found for this product",
    };
  }

  let available = inventory.availableQty;
  let reserved = inventory.reservedQty;
  let damaged = inventory.damagedQty;

  const previousQty = available;

  // 🔁 STOCK LOGIC
  switch (type) {
    case "IN":
      available += quantity;
      break;

    case "OUT":
      if (available < quantity)
        throw {
          statusCode: 400,
          errorCode: "INSUFFICIENT_STOCK",
          message: "Not enough available stock",
        };
      available -= quantity;
      break;

    case "RESERVED":
      if (available < quantity)
        throw {
          statusCode: 400,
          errorCode: "INSUFFICIENT_STOCK",
          message: "Not enough stock to reserve",
        };
      available -= quantity;
      reserved += quantity;
      break;

    case "RELEASED":
      if (reserved < quantity)
        throw {
          statusCode: 400,
          errorCode: "INVALID_RELEASE",
          message: "Release quantity exceeds reserved stock",
        };
      reserved -= quantity;
      available += quantity;
      break;

    case "DAMAGE":
      if (available < quantity)
        throw {
          statusCode: 400,
          errorCode: "INVALID_DAMAGE",
          message: "Damage quantity exceeds available stock",
        };
      available -= quantity;
      damaged += quantity;
      break;

    default:
      throw {
        statusCode: 400,
        errorCode: "INVALID_TYPE",
        message: "Invalid stock movement type",
      };
  }

  const status =
    available === 0
      ? "OUT_OF_STOCK"
      : available <= inventory.reorderLevel
      ? "LOW_STOCK"
      : "IN_STOCK";

  // 🔐 TRANSACTION (SAFE)
  return prisma.$transaction(async (tx) => {
    await tx.productInventory.update({
      where: { productId },
      data: {
        availableQty: available,
        reservedQty: reserved,
        damagedQty: damaged,
        status,
      },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        inventoryId: inventory.id,
        type: type as any,
        quantity,
        previousQty,
        currentQty: available,
        reason,
        referenceId,
      },
    });

    return {
      availableQty: available,
      reservedQty: reserved,
      damagedQty: damaged,
      status,
    };
  });
}







static async getAnalyticsSummary() {
  const [lowStock, outStock] = await Promise.all([
    prisma.productInventory.count({ where: { status: "LOW_STOCK" as any } }),
    prisma.productInventory.count({ where: { status: "OUT_OF_STOCK" as any } }),
  ]);

  // Dead stock = no movement in last 60 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const deadStock = await prisma.productInventory.count({
    where: {
      movements: {
        none: { createdAt: { gte: sixtyDaysAgo } },
      },
    },
  });

  const inventories = await prisma.productInventory.findMany({
    select: { availableQty: true, averageCost: true, costPrice: true },
  });

  const totalInventoryValue = inventories.reduce((sum, i) => {
    const cost = i.averageCost || i.costPrice || 0;
    return sum + cost * i.availableQty;
  }, 0);

  return {
    totalInventoryValue,
    lowStockCount: lowStock,
    outOfStockCount: outStock,
    deadStockCount: deadStock,
  };
}










static async getMovementAnalytics(days: number) {
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const movements = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: {
      type: "OUT" as any,
      createdAt: { gte: fromDate },
    },
    _sum: { quantity: true },
  });

  const sorted = movements.sort(
    (a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0)
  );

  return {
    fastMoving: sorted.slice(0, 5).map((x) => ({
      productId: x.productId,
      soldQty: x._sum.quantity || 0,
    })),
    slowMoving: sorted.slice(-5).map((x) => ({
      productId: x.productId,
      soldQty: x._sum.quantity || 0,
    })),
  };
}







static async getStockReport(from: string, to: string) {
  if (!from || !to) throw new Error("Invalid date");

  const start = new Date(from);
  const end = new Date(to);

  const [inAgg, outAgg] = await Promise.all([
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: { type: "IN" as any, createdAt: { gte: start, lte: end } },
    }),
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: { type: "OUT" as any, createdAt: { gte: start, lte: end } },
    }),
  ]);

  const totalIn = inAgg._sum.quantity || 0;
  const totalOut = outAgg._sum.quantity || 0;

  return {
    totalIn,
    totalOut,
    netChange: totalIn - totalOut,
  };
}






// static async createProduct(payload: {
//   name: string;
//   slug: string;
//   basePrice: number;
//   productCategoryId: string;
//   sku: string;
//   reorderLevel?: number;
//   costPrice?: number;
// }) {
//   const {
//     name,
//     slug,
//     basePrice,
//     productCategoryId,
//     sku,
//     reorderLevel = 5,
//     costPrice = 0,
//   } = payload;

//   // 🔍 Validation
//   if (!name || !slug || !basePrice || !productCategoryId || !sku) {
//     throw {
//       statusCode: 400,
//       errorCode: "INVALID_INPUT",
//       message: "Name, slug, basePrice, category and SKU are required",
//     };
//   }

//   // 🔒 Transaction (product + inventory together)
//   return prisma.$transaction(async (tx) => {
//     const product = await tx.product.create({
//       data: {
//         name,
//         slug,
//         basePrice,
//         productCategoryId,
//         availability: "IN_STOCK",
//         brandType: "LOCAL",
//       },
//     });

//     const inventory = await tx.productInventory.create({
//       data: {
//         productId: product.id,
//         sku,
//         reorderLevel,
//         costPrice,
//         availableQty: 0,
//         reservedQty: 0,
//         damagedQty: 0,
//         status: "OUT_OF_STOCK",
//       },
//     });

//     return {
//       productId: product.id,
//       name: product.name,
//       sku: inventory.sku,
//       reorderLevel: inventory.reorderLevel,
//     };
//   });
// }




static async createProduct(payload: {
  name: string;
  slug?: string;
  basePrice: number;
  productCategoryId: string;
  sku?: string;
  reorderLevel?: number;
  costPrice?: number;
}) {
  const {
    name,
    slug,
    basePrice,
    productCategoryId,
    sku,
    reorderLevel = 5,
    costPrice = 0,
  } = payload;

  // 🔍 Validation (slug & sku removed from required)
  if (!name || !basePrice || !productCategoryId) {
    throw {
      statusCode: 400,
      errorCode: "INVALID_INPUT",
      message: "Name, basePrice and category are required",
    };
  }

  // 🔧 Dynamic generation
  const finalSlug = slug
    ? await generateUniqueSlug(slug)
    : await generateUniqueSlug(name);

  const finalSKU = sku
    ? sku
    : await generateUniqueSKU(
        name.substring(0, 3).toUpperCase()
      );

  // 🔒 Transaction
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        slug: finalSlug,
        basePrice,
        productCategoryId,
        availability: "IN_STOCK",
        brandType: "LOCAL",
      },
    });

    const inventory = await tx.productInventory.create({
      data: {
        productId: product.id,
        sku: finalSKU,
        reorderLevel,
        costPrice,
        availableQty: 0,
        reservedQty: 0,
        damagedQty: 0,
        status: "OUT_OF_STOCK",
      },
    });

    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: inventory.sku,
      reorderLevel: inventory.reorderLevel,
    };
  });
}



static async updateProduct(
  productId: string,
  payload: {
    name?: string;
    basePrice?: number;
    visibility?: boolean;
    reorderLevel?: number;
    costPrice?: number;
  }
) {
  if (!productId) {
    throw {
      statusCode: 400,
      errorCode: "PRODUCT_ID_MISSING",
      message: "Product ID is required",
    };
  }

  const productExists = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!productExists) {
    throw {
      statusCode: 404,
      errorCode: "PRODUCT_NOT_FOUND",
      message: "Product not found",
    };
  }

  return prisma.$transaction(async (tx) => {
    // Update product table
    if (
      payload.name ||
      payload.basePrice ||
      payload.visibility !== undefined
    ) {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: payload.name,
          basePrice: payload.basePrice,
          visibility: payload.visibility,
        },
      });
    }

    // Update inventory table
    if (payload.reorderLevel || payload.costPrice) {
      await tx.productInventory.update({
        where: { productId },
        data: {
          reorderLevel: payload.reorderLevel,
          costPrice: payload.costPrice,
        },
      });
    }

    return { productId };
  });
}




static async deleteInventoryProduct(
  productId: string,
  adminId?: string
) {
  const inventory = await prisma.productInventory.findUnique({
    where: { productId },
  });

  if (!inventory) {
    throw {
      statusCode: 404,
      errorCode: "INVENTORY_NOT_FOUND",
      message: "Inventory not found for this product",
    };
  }

  const totalQty =
    inventory.availableQty +
    inventory.reservedQty +
    inventory.damagedQty;

  if (totalQty === 0 && inventory.status === "OUT_OF_STOCK") {
    throw {
      statusCode: 400,
      errorCode: "ALREADY_REMOVED",
      message: "Inventory already removed",
    };
  }

  await prisma.$transaction(async (tx) => {
    // 1️⃣ Create audit movement
    await tx.stockMovement.create({
      data: {
        inventoryId: inventory.id,
        productId: inventory.productId,
        type: "ADJUSTMENT",
        quantity: -totalQty,
        previousQty: totalQty,
        currentQty: 0,
        reason: "Inventory product removed",
        updatedBy: adminId,
      },
    });

    // 2️⃣ Reset inventory
    await tx.productInventory.update({
      where: { id: inventory.id },
      data: {
        availableQty: 0,
        reservedQty: 0,
        damagedQty: 0,
        status: "OUT_OF_STOCK",
      },
    });
  });
}





static async adjustInventory(
  payload: {
    productId: string;
    newAvailableQty: number;
    newDamagedQty: number;
    reason: string;
  },
  adminId?: string
) {
  const {
    productId,
    newAvailableQty,
    newDamagedQty,
    reason,
  } = payload;

  // 🔒 Validation
  if (
    !productId ||
    newAvailableQty < 0 ||
    newDamagedQty < 0 ||
    !reason
  ) {
    throw {
      statusCode: 400,
      errorCode: "INVALID_ADJUSTMENT",
      message: "Invalid adjustment data",
    };
  }

  const inventory = await prisma.productInventory.findUnique({
    where: { productId },
  });

  if (!inventory) {
    throw {
      statusCode: 404,
      errorCode: "INVENTORY_NOT_FOUND",
      message: "Inventory not found",
    };
  }

  const previousTotal =
    inventory.availableQty + inventory.damagedQty;

  const newTotal =
    newAvailableQty + newDamagedQty;

  await prisma.$transaction(async (tx) => {
    // 🔁 Update inventory
    await tx.productInventory.update({
      where: { id: inventory.id },
      data: {
        availableQty: newAvailableQty,
        damagedQty: newDamagedQty,
        status:
          newAvailableQty === 0
            ? "OUT_OF_STOCK"
            : newAvailableQty <= inventory.reorderLevel
            ? "LOW_STOCK"
            : "IN_STOCK",
      },
    });

    // 🧾 Audit log
    await tx.stockMovement.create({
      data: {
        inventoryId: inventory.id,
        productId,
        type: "ADJUSTMENT",
        quantity: newTotal - previousTotal,
        previousQty: previousTotal,
        currentQty: newTotal,
        reason,
        updatedBy: adminId,
      },
    });
  });

  return {
    productId,
    previousQty: previousTotal,
    newAvailableQty,
    newDamagedQty,
  };
}






}



  







