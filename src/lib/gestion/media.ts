import "server-only";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media";
import { slugify } from "./format";

export const MEDIA_BUCKET = "media";

/** Clé Storage façon WordPress : `YYYY/MM/<nom>-<suffixe>.<ext>`. */
export function buildMediaPath(fileName: string, now = new Date()): string {
  const dot = fileName.lastIndexOf(".");
  const ext = (dot > 0 ? fileName.slice(dot + 1) : "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = slugify(dot > 0 ? fileName.slice(0, dot) : fileName) || "image";
  const suffix = Math.random().toString(36).slice(2, 7);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}/${month}/${base}-${suffix}.${ext}`;
}

export function publicMediaUrl(path: string): string {
  return mediaUrl(path);
}

/** Chemin Storage à partir d'une URL publique du bucket `media`, sinon null. */
export function mediaPathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

/** Où une image est utilisée (produits, variantes, catégories). */
export async function findMediaUsage(url: string) {
  const [products, variants, categories] = await Promise.all([
    prisma.product.findMany({
      where: { OR: [{ primaryImageUrl: url }, { galleryImageUrls: { has: url } }] },
      select: { id: true, name: true },
    }),
    prisma.variant.count({ where: { imageUrl: url } }),
    prisma.category.findMany({ where: { imageUrl: url }, select: { id: true, name: true } }),
  ]);
  return { products, variants, categories, total: products.length + variants + categories.length };
}
