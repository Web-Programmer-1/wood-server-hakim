import { prisma } from "../../shared/prisma";

const addToCart = async (
  userId: string,
  payload: { productId: string; quantity?: number }
) => {
  const { productId, quantity = 1 } = payload;

  // 1️⃣ Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.visibility) {
    throw new Error("Product not found");
  }

  const price =
    product.discountPrice && product.discountPrice < product.basePrice
      ? product.discountPrice
      : product.basePrice;

  // 2️⃣ Find or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    // 🔁 Increase quantity
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  }

  // 4️⃣ Create new cart item
  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
      price,
    },
  });
};





const getCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                orderBy: { orderIndex: "asc" },
                take: 1, // primary image
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
    };
  }

  const items = cart.items.map((item) => {
    const subtotal = item.price * item.quantity;

    return {
      id: item.id,
      product: item.product,
      price: item.price,
      quantity: item.quantity,
      subtotal,
    };
  });

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  return {
    items,
    totalQuantity,
    totalAmount,
  };
};


const updateQuantity = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  if (!quantity || quantity < 0) {
    throw new Error("Quantity must be a positive number");
  }

  // 1️⃣ Find cart item (ensure ownership)
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        userId,
      },
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // 2️⃣ Quantity = 0 → remove item (recommended UX)
  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { removed: true };
  }

  // 3️⃣ Update quantity
  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
};





const removeItem = async (userId: string, itemId: string) => {
  // 1️⃣ Find cart item and ensure ownership
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        userId,
      },
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // 2️⃣ Delete cart item
  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  return true;
};


export const CartService = {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,

};