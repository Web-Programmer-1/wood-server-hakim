import { prisma } from "../../shared/prisma";

export const InventoryService = {
  async getAllProducts() {
    const products = await prisma.product.findMany({
      where: { visibility: true },
      select: {
        id: true,
        name: true,

        images: {
          where: { isPrimary: true },
          select: {
            imageUrl: true,
          },
          take: 1,
        },
        stockQuantity: true,
        reservedQty: true,
        damagedQty: true,
        reorderLevel: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return products.map((p) => {
      const available = p.stockQuantity - p.reservedQty - p.damagedQty;

      let stockStatus = "IN_STOCK";

      if (available === 0) stockStatus = "OUT_OF_STOCK";
      else if (available <= p.reorderLevel) stockStatus = "LOW_STOCK";

      return {
        ...p,
        availableQty: available,
        stockStatus,
      };
    });
  },



  async restockProduct(payload: {
  productId: string;
  quantity: number;
}) {
  const { productId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // 1️⃣ Update stock
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stockQuantity: {
          increment: quantity,
        },
      },
    });

    await tx.stockMovement.create({
      data: {
        itemType: "PRODUCT",
        itemId: productId,
        type: "IN",
        quantity,
        note: "Product Restocked",
      },
    });

    const available =
      updated.stockQuantity -
      updated.reservedQty -
      updated.damagedQty;

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      availableQty: available,
    };
  });
},




async reserveProduct(payload: {
  productId: string;
  quantity: number;
}) {
  const { productId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const available =
      product.stockQuantity -
      product.reservedQty -
      product.damagedQty;

    if (available < quantity) {
      throw new Error("Insufficient stock");
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        reservedQty: {
          increment: quantity,
        },
      },
    });

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      reservedQty: updated.reservedQty,
      availableQty:
        updated.stockQuantity -
        updated.reservedQty -
        updated.damagedQty,
    };
  });
},





async confirmSale(payload: {
  productId: string;
  quantity: number;
}) {
  const { productId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.reservedQty < quantity) {
      throw new Error("Invalid sale quantity");
    }

    // 1️⃣ Update stock
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
        reservedQty: {
          decrement: quantity,
        },
      },
    });

    // 2️⃣ 🔥 Movement insert
    await tx.stockMovement.create({
      data: {
        itemType: "PRODUCT",
        itemId: productId,
        type: "OUT",
        quantity,
        note: "Product Sale Confirmed",
      },
    });

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      reservedQty: updated.reservedQty,
      availableQty:
        updated.stockQuantity -
        updated.reservedQty -
        updated.damagedQty,
    };
  });
},





async releaseProduct(payload: {
  productId: string;
  quantity: number;
}) {
  const { productId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.reservedQty < quantity) {
      throw new Error("Invalid release quantity");
    }

    // 1️⃣ Update reserved qty
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        reservedQty: {
          decrement: quantity,
        },
      },
    });

    // 2️⃣ 🔥 Movement insert
    await tx.stockMovement.create({
      data: {
        itemType: "PRODUCT",
        itemId: productId,
        type: "RELEASE",
        quantity,
        note: "Product Reservation Released",
      },
    });

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      reservedQty: updated.reservedQty,
      availableQty:
        updated.stockQuantity -
        updated.reservedQty -
        updated.damagedQty,
    };
  });
},





// async damageProduct(payload: {
//   productId: string;
//   quantity: number;
// }) {
//   const { productId, quantity } = payload;

//   return prisma.$transaction(async (tx) => {
//     const product = await tx.product.findUnique({
//       where: { id: productId },
//     });

//     if (!product) {
//       throw new Error("Product not found");
//     }

//     const available =
//       product.stockQuantity -
//       product.reservedQty -
//       product.damagedQty;

//     if (available < quantity) {
//       throw new Error("Insufficient stock for damage");
//     }

//     const updated = await tx.product.update({
//       where: { id: productId },
//       data: {
//         stockQuantity: {
//           decrement: quantity,
//         },
//         damagedQty: {
//           increment: quantity,
//         },
//       },
//     });

//     return {
//       id: updated.id,
//       stockQuantity: updated.stockQuantity,
//       damagedQty: updated.damagedQty,
//       availableQty:
//         updated.stockQuantity -
//         updated.reservedQty -
//         updated.damagedQty,
//     };
//   });
// },



async damageProduct(payload: {
  productId: string;
  quantity: number;
}) {
  const { productId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const available =
      product.stockQuantity -
      product.reservedQty -
      product.damagedQty;

    if (available < quantity) {
      throw new Error("Insufficient stock for damage");
    }

    // 1️⃣ Update stock + damaged
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
        damagedQty: {
          increment: quantity,
        },
      },
    });

    // 2️⃣ 🔥 Movement insert
    await tx.stockMovement.create({
      data: {
        itemType: "PRODUCT",
        itemId: productId,
        type: "DAMAGE",
        quantity,
        note: "Product Damaged",
      },
    });

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      damagedQty: updated.damagedQty,
      availableQty:
        updated.stockQuantity -
        updated.reservedQty -
        updated.damagedQty,
    };
  });
},




async getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { visibility: true },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      reservedQty: true,
      damagedQty: true,
      reorderLevel: true,
    },
  });

  const lowStockList = products
    .map((p) => {
      const available =
        p.stockQuantity -
        p.reservedQty -
        p.damagedQty;

      if (available <= p.reorderLevel) {
        return {
          id: p.id,
          name: p.name,
          availableQty: available,
          reorderLevel: p.reorderLevel,
          status:
            available === 0
              ? "OUT_OF_STOCK"
              : "LOW_STOCK",
        };
      }

      return null;
    })
    .filter(Boolean);

  return {
    totalLowStock: lowStockList.length,
    products: lowStockList,
  };
},





async getAllMachines() {
  const machines = await prisma.machine.findMany({
    where: { isActive: true },
    select: {
      id: true,
      images:true,
      name: true,
      stockQuantity: true,
      bookedQty: true,
    },
    orderBy:{
      stockQuantity: "desc",
    }
  });

  return machines.map((m) => {
    const available =
      m.stockQuantity - m.bookedQty;

    let stockStatus = "IN_STOCK";

    if (available === 0) stockStatus = "OUT_OF_STOCK";

    return {
      ...m,
      availableQty: available,
      stockStatus,
    };
  });
},




async restockMachine(payload: {
  machineId: string;
  quantity: number;
}) {
  const { machineId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const machine = await tx.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new Error("Machine not found");
    }

    // 1️⃣ Update machine stock
    const updated = await tx.machine.update({
      where: { id: machineId },
      data: {
        stockQuantity: {
          increment: quantity,
        },
      },
    });

    // 2️⃣ 🔥 Insert stock movement
    await tx.stockMovement.create({
      data: {
        itemType: "MACHINE",
        itemId: machineId,
        type: "IN", // Restock = IN
        quantity: quantity,
        note: "Machine Restocked",
      },
    });

    // 3️⃣ Calculate available
    const available =
      updated.stockQuantity - updated.bookedQty;

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      availableQty: available,
    };
  });
},





  async bookMachine(payload: {
  machineId: string;
  quantity: number;
}) {
  const { machineId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const machine = await tx.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new Error("Machine not found");
    }

    const available =
      machine.stockQuantity - machine.bookedQty;

    if (available < quantity) {
      throw new Error("Insufficient stock");
    }

    // 1️⃣ Update bookedQty
    const updated = await tx.machine.update({
      where: { id: machineId },
      data: {
        bookedQty: {
          increment: quantity,
        },
      },
    });

    // 2️⃣ 🔥 Movement insert
    await tx.stockMovement.create({
      data: {
        itemType: "MACHINE",
        itemId: machineId,
        type: "RESERVE",
        quantity,
        note: "Machine Booked",
      },
    });

    return {
      id: updated.id,
      bookedQty: updated.bookedQty,
      availableQty:
        updated.stockQuantity - updated.bookedQty,
    };
  });
},






async confirmMachineSale(payload: {
  machineId: string;
  quantity: number;
}) {
  const { machineId, quantity } = payload;

  return prisma.$transaction(async (tx) => {
    const machine = await tx.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new Error("Machine not found");
    }

    if (machine.stockQuantity < quantity) {
      throw new Error("Not enough machine stock");
    }

    const updated = await tx.machine.update({
      where: { id: machineId },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
      },
    });

    return {
      id: updated.id,
      stockQuantity: updated.stockQuantity,
      availableQty: updated.stockQuantity,
    };
  });
},





  async releaseMachine(payload: {
    machineId: string;
    quantity: number;
  }) {
    const { machineId, quantity } = payload;

    return prisma.$transaction(async (tx) => {
      const machine = await tx.machine.findUnique({
        where: { id: machineId },
      });

      if (!machine) {
        throw new Error("Machine not found");
      }

      if (machine.bookedQty < quantity) {
        throw new Error("Invalid release quantity");
      }

      const updated = await tx.machine.update({
        where: { id: machineId },
        data: {
          bookedQty: {
            decrement: quantity,
          },
        },
      });

      return {
        id: updated.id,
        bookedQty: updated.bookedQty,
        availableQty:
          updated.stockQuantity -
          updated.bookedQty,
      };
    });
  },







async getInventoryActivity(limit = 20) {

  //  Step 1: 24 hour log delete
  await prisma.stockMovement.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  //  Step 2:  latest data fetch
  const movements = await prisma.stockMovement.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: Number(limit),
  });

  const enriched = await Promise.all(
    movements.map(async (m) => {
      let itemName = "";

      if (m.itemType === "PRODUCT") {
        const product = await prisma.product.findUnique({
          where: { id: m.itemId },
          select: { name: true },
        });
        itemName = product?.name || "Unknown Product";
      }

      if (m.itemType === "MACHINE") {
        const machine = await prisma.machine.findUnique({
          where: { id: m.itemId },
          select: { name: true },
        });
        itemName = machine?.name || "Unknown Machine";
      }

      return {
        id: m.id,
        itemType: m.itemType,
        itemId: m.itemId,
        itemName,
        movementType: m.type,
        quantity: m.quantity,
        note: m.note,
        createdAt: m.createdAt,
      };
    })
  );

  return enriched;
},




async  getInventorySummary() {


  const machineAggregate = await prisma.machine.aggregate({
    _count: { id: true },
    _sum: {
      stockQuantity: true,
      bookedQty: true,
    },
  });

  // 🔥 Product Summary
  const productAggregate = await prisma.product.aggregate({
    _count: { id: true },
    _sum: {
      stockQuantity: true,
    },
  });

  // 🔥 Last 24h Activity Count
  const last24hActivity = await prisma.stockMovement.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const totalMachineStock = machineAggregate._sum.stockQuantity || 0;
  const totalBooked = machineAggregate._sum.bookedQty || 0;

  return {
    machines: {
      totalMachines: machineAggregate._count.id || 0,
      totalStock: totalMachineStock,
      totalBooked,
      totalAvailable: totalMachineStock - totalBooked,
    },
    products: {
      totalProducts: productAggregate._count.id || 0,
      totalStock: productAggregate._sum.stockQuantity || 0,
    },
    activity: {
      last24hCount: last24hActivity,
    },
  };
}









};
