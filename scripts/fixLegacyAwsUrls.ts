

import "../src/loadEnv";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODE = (process.env.MODE || "dry").toLowerCase() as
  | "dry"
  | "rewrite"
  | "null";

const CDN_BASE = (process.env.BB_CDN_BASE_URL || "").replace(/\/+$/, "");
if (MODE === "rewrite" && !CDN_BASE) {
  throw new Error("BB_CDN_BASE_URL must be set when MODE=rewrite.");
}

const isLegacyAwsUrl = (s: string | null | undefined): s is string =>
  typeof s === "string" && /\.amazonaws\.com\//i.test(s);

const extractKey = (url: string): string | null => {
  // virtual-hosted: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const vhost = url.match(/^https?:\/\/[^/]+\.amazonaws\.com\/(.+)$/i);
  if (vhost) return vhost[1];

  // path-style: https://s3.<region>.amazonaws.com/<bucket>/<key>
  const path = url.split(".amazonaws.com/")[1];
  if (path) {
    const parts = path.split("/");
    return parts.slice(1).join("/") || null;
  }
  return null;
};

const rewrite = (url: string): string | null => {
  const key = extractKey(url);
  return key ? `${CDN_BASE}/${key}` : null;
};

// Every column that holds a public URL.
type Target = { model: string; field: string; array?: boolean };
const TARGETS: Target[] = [
  { model: "blog", field: "coverImage" },
  { model: "event", field: "bannerImage" },
  { model: "companyLogo", field: "imageUrl" },
  { model: "footer", field: "logoUrl" },
  { model: "heroSection", field: "logoImage" },
  { model: "heroSection", field: "imageUrl" },
  { model: "heroSection", field: "videoUrl" },
  { model: "category", field: "thumbnailImage" },
  { model: "subCategory", field: "thumbnailImage" },
  { model: "machine", field: "thumbnailImage" },
  { model: "machine", field: "bannerImage" },
  { model: "machine", field: "customerImages", array: true },
  { model: "machine", field: "fileUploadLink" },
  { model: "machineImage", field: "url" },
  { model: "machineVideo", field: "url" },
  { model: "userProfile", field: "avatarUri" },
  { model: "shadhinotaImage", field: "url" },
  { model: "shadhinotaVideo", field: "url" },
  { model: "shadhinotaUploadVideo", field: "url" },
  { model: "productCategory", field: "coverImage" },
  { model: "productVariant", field: "imageUrl" },
  { model: "productImage", field: "imageUrl" },
  { model: "megaOffer", field: "imageUrl" },
  { model: "galleryImage", field: "imageUrl" },
  { model: "landingVideo", field: "thumbnailUrl" },
  { model: "landingVideo", field: "videoUrl" },
  { model: "serviceSection", field: "bgImageUrl" },
  { model: "testimonialSection", field: "avatarUrl" },
  { model: "testimonialSection", field: "cardBgImageUrl" },
  { model: "testimonialSection", field: "videoUrl" },
  { model: "consultencyBanner", field: "bgImageUrl" },
  { model: "foundationStory", field: "cardImageUrl" },
  { model: "foundationStory", field: "videoUrl" },
];

const processTarget = async ({ model, field, array }: Target) => {
  const delegate = (prisma as any)[model];
  if (!delegate) {
    console.warn(`  [skip] prisma.${model} not found`);
    return { scanned: 0, hits: 0, updated: 0 };
  }

  const rows: any[] = await delegate.findMany({
    select: { id: true, [field]: true },
  });

  let hits = 0;
  let updated = 0;

  for (const row of rows) {
    const value = row[field];

    if (array) {
      if (!Array.isArray(value)) continue;
      const legacyIdxs = value
        .map((v: string, i: number) => (isLegacyAwsUrl(v) ? i : -1))
        .filter((i: number) => i >= 0);
      if (legacyIdxs.length === 0) continue;

      hits += legacyIdxs.length;

      if (MODE === "dry") continue;

      let next: string[];
      if (MODE === "rewrite") {
        next = value.map((v: string) =>
          isLegacyAwsUrl(v) ? rewrite(v) ?? v : v,
        );
      } else {
        next = value.filter((v: string) => !isLegacyAwsUrl(v));
      }

      await delegate.update({ where: { id: row.id }, data: { [field]: next } });
      updated += 1;
      continue;
    }

    if (!isLegacyAwsUrl(value)) continue;
    hits += 1;
    if (MODE === "dry") continue;

    const next = MODE === "rewrite" ? rewrite(value) : null;
    await delegate.update({ where: { id: row.id }, data: { [field]: next } });
    updated += 1;
  }

  return { scanned: rows.length, hits, updated };
};

const main = async () => {
  console.log(`\nMode: ${MODE.toUpperCase()}`);
  if (MODE === "rewrite") console.log(`CDN base: ${CDN_BASE}\n`);
  else console.log("");

  let totalHits = 0;
  let totalUpdated = 0;

  for (const target of TARGETS) {
    const { hits, updated } = await processTarget(target);
    if (hits === 0) continue;
    totalHits += hits;
    totalUpdated += updated;
    console.log(
      `  ${target.model}.${target.field}: ${hits} legacy URL${hits === 1 ? "" : "s"}` +
        (MODE === "dry" ? " (dry run)" : ` → ${updated} row${updated === 1 ? "" : "s"} updated`),
    );
  }

  console.log(
    `\nTotal: ${totalHits} legacy URL${totalHits === 1 ? "" : "s"} found` +
      (MODE === "dry"
        ? ". Re-run with MODE=rewrite or MODE=null to apply changes."
        : `, ${totalUpdated} row${totalUpdated === 1 ? "" : "s"} updated.`),
  );
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
