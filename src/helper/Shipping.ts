import { prisma } from "../app/shared/prisma";

export const getShippingFee = async (
  city: string,
  paymentMethod: "COD" | "ONLINE"
): Promise<number> => {
  if (paymentMethod !== "COD") return 0;

  const rate = await prisma.shippingRate.findUnique({
    where: { city: city.toUpperCase() },
  });

  if (!rate || !rate.isActive) return 0;

  return rate.fee;
};
