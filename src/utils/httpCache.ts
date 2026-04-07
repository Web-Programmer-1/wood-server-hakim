import crypto from "crypto";
import redis from "./redis";

/** Short TTLs — admin changes invalidate keys; TTL is safety net only */
export const CacheTTL = {
  productList: 90,
  productDetail: 120,
  productRelated: 120,
  productBrands: 600,
  productCategoryList: 300,
  machineList: 90,
  machineFeatured: 120,
  machineSearch: 60,
  machineDetail: 120,
  machineRelated: 120,
  categoryList: 300,
  categoryTree: 300,
  categoryMachines: 90,
} as const;

function redisUsable(): boolean {
  return Boolean(redis && typeof (redis as { isOpen?: boolean }).isOpen === "boolean" && (redis as { isOpen: boolean }).isOpen);
}

export function stableQueryHash(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const normalized: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    const v = obj[k];
    if (v === undefined) continue;
    normalized[k] = v;
  }
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .slice(0, 32);
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redisUsable()) {
    return fetcher();
  }
  try {
    const raw = await redis!.get(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.warn("[httpCache] get", key, e);
  }

  const data = await fetcher();
  try {
    await redis!.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (e) {
    console.warn("[httpCache] set", key, e);
  }
  return data;
}

async function deleteCacheByPattern(pattern: string): Promise<void> {
  if (!redisUsable()) return;
  try {
    const client = redis!;
    const scanIterator = (client as unknown as { scanIterator?: (opts: { MATCH: string; COUNT: number }) => AsyncIterable<string> }).scanIterator;
    if (typeof scanIterator === "function") {
      for await (const k of scanIterator.call(client, { MATCH: pattern, COUNT: 200 })) {
        await client.del(k);
      }
      return;
    }
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (e) {
    console.warn("[httpCache] delete pattern", pattern, e);
  }
}

export async function invalidateProductCategoryReadCaches(): Promise<void> {
  await deleteCacheByPattern("cache:productCategory:*");
}

export async function invalidateProductReadCaches(): Promise<void> {
  await Promise.all([
    deleteCacheByPattern("cache:product:list:*"),
    deleteCacheByPattern("cache:product:detail:*"),
    deleteCacheByPattern("cache:product:related:*"),
    deleteCacheByPattern("cache:product:brands*"),
  ]);
}

export async function invalidateMachineReadCaches(): Promise<void> {
  await Promise.all([
    deleteCacheByPattern("cache:machine:list:*"),
    deleteCacheByPattern("cache:machine:featured*"),
    deleteCacheByPattern("cache:machine:search:*"),
    deleteCacheByPattern("cache:machine:detail:*"),
    deleteCacheByPattern("cache:machine:related:*"),
  ]);
}

export async function invalidateCategoryReadCaches(): Promise<void> {
  await Promise.all([
    deleteCacheByPattern("cache:category:list*"),
    deleteCacheByPattern("cache:category:tree*"),
    deleteCacheByPattern("cache:category:machines:*"),
  ]);
}
