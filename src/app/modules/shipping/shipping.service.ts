import { prisma } from "../../shared/prisma";

const upsertRate = async (payload: { city: string; fee: number }) => {
  return prisma.shippingRate.upsert({
    where: { city: payload.city.toUpperCase() },
    update: {
      fee: payload.fee,
      isActive: true,
    },
    create: {
      city: payload.city.toUpperCase(),
      fee: payload.fee,
    },
  });
};

const getAllRates = async () => {
  return prisma.shippingRate.findMany({
    orderBy: { city: "asc" },
  });
};

const toggleRate = async (id: string, isActive: boolean) => {
  return prisma.shippingRate.update({
    where: { id },
    data: { isActive },
  });
};

export const ShippingRateService = {
  upsertRate,
  getAllRates,
  toggleRate,
};
