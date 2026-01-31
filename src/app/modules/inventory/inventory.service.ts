import { prisma } from "../../shared/prisma";

const getSummary = async () => {
  const totalProducts = await prisma.productInventory.count();
  const lowStockCount = await prisma.productInventory.count({
    where: {
      stockQuantity: { lte: prisma.productInventory.fields.reorderLevel }
    }
  });

  const outOfStockCount = await prisma.productInventory.count({
    where: { stockQuantity: 0 }
  });

  return {
    totalProducts,
    lowStockCount,
    outOfStockCount
  };
};


export const InventoryService = {
  getSummary,
}

