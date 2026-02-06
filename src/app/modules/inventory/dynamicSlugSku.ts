import slugify from "slugify";
import { prisma } from "../../shared/prisma";

// ---------- SLUG ----------
export async function generateUniqueSlug(
  base: string
): Promise<string> {
  let slug = slugify(base, {
    lower: true,
    strict: true,
    trim: true,
  });

  let count = 0;
  let uniqueSlug = slug;

  while (
    await prisma.product.findUnique({
      where: { slug: uniqueSlug },
    })
  ) {
    count++;
    uniqueSlug = `${slug}-${count}`;
  }

  return uniqueSlug;
}

// ---------- SKU ----------
export async function generateUniqueSKU(
  prefix = "SKU"
): Promise<string> {
  let sku: string;
  let exists = true;

  while (exists) {
    sku = `${prefix}-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    exists = !!(await prisma.productInventory.findUnique({
      where: { sku },
    }));
  }

  return sku!;
}
