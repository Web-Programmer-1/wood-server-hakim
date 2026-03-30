import { Prisma } from "@prisma/client";

// ✅ সব original fields সহ — কিছুই বাদ নেই
 export const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,        // ✅ ছিল, বাদ পড়েছিল
  basePrice: true,
  discountPrice: true,
  discountPercent: true,
  availability: true,
  brandType: true,
  productType: true,
  rating: true,
  ratingCount: true,
  keyPoints: true,          // ✅ ছিল, বাদ পড়েছিল
  productCategoryId: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,          // ✅ ছিল, বাদ পড়েছিল
  stockQuantity: true,
  damagedQty: true,         // ✅ ছিল, বাদ পড়েছিল
  reorderLevel: true,       // ✅ ছিল, বাদ পড়েছিল
  reservedQty: true,        // ✅ ছিল, বাদ পড়েছিল
} satisfies Prisma.ProductSelect;