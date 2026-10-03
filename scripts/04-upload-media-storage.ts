/**
 * Rapatrie les médias WordPress dans Supabase Storage (bucket public `media`)
 * et réécrit les liens d'images en base (Product, Variant, Category, MediaAsset).
 *
 * - Télécharge chaque MediaAsset.originalUrl, l'envoie sous la même clé (`YYYY/MM/fichier`).
 * - Idempotent : les assets avec publicUrl sont sautés sauf --force.
 * - À la fin, remplace le préfixe WordPress par la base Storage dans toutes les URLs d'images.
 *
 * Env : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, NEXT_PUBLIC_MEDIA_BASE_URL (base publique à écrire en DB).
 * Usage : yarn migrate:media-storage [--force] [--concurrency=4]
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const concurrency = Number([...args].find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4);

const BUCKET = "media";
const WP_UPLOADS = `${process.env.WP_SITE_URL ?? "https://taxidermiedelestrie.com"}/wp-content/uploads/`;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} requis`);
  return v;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secret = requireEnv("SUPABASE_SECRET_KEY");
  const mediaBase = requireEnv("NEXT_PUBLIC_MEDIA_BASE_URL").replace(/\/+$/, "");
  const supabase = createClient(supabaseUrl, secret, { auth: { persistSession: false } });

  const assets = await prisma.mediaAsset.findMany({
    where: force ? {} : { publicUrl: null },
    orderBy: { id: "asc" },
  });
  console.log(`[media] ${assets.length} fichiers à transférer`);

  let ok = 0, failed = 0;
  const queue = [...assets];
  async function worker() {
    for (;;) {
      const a = queue.shift();
      if (!a) return;
      try {
        const res = await fetch(a.originalUrl, { headers: { "User-Agent": "Mouldec-Migration/1.0 (+max@pelti.co)" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") ?? a.mimeType ?? "application/octet-stream";
        const { error } = await supabase.storage.from(BUCKET).upload(a.filePath, buf, { contentType, upsert: true });
        if (error) throw new Error(error.message);
        await prisma.mediaAsset.update({
          where: { id: a.id },
          data: { publicUrl: `${mediaBase}/${a.filePath}`, fileSize: buf.length, downloadedAt: new Date() },
        });
        ok++;
      } catch (e) {
        failed++;
        console.warn(`[media]   échec ${a.filePath}: ${e instanceof Error ? e.message : String(e)}`);
      }
      if ((ok + failed) % 50 === 0) console.log(`[media]   ${ok + failed}/${assets.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`[media] transférés: ${ok}, échecs: ${failed}`);

  // ---- Réécriture des liens en base (préfixe WordPress → base Storage) ----
  const rewrite = (url: string | null) => (url && url.startsWith(WP_UPLOADS) ? `${mediaBase}/${url.slice(WP_UPLOADS.length)}` : url);

  const products = await prisma.product.findMany({ select: { id: true, primaryImageUrl: true, galleryImageUrls: true } });
  let changed = 0;
  for (const p of products) {
    const primary = rewrite(p.primaryImageUrl);
    const gallery = p.galleryImageUrls.map((u) => rewrite(u) ?? u);
    if (primary !== p.primaryImageUrl || gallery.some((u, i) => u !== p.galleryImageUrls[i])) {
      await prisma.product.update({ where: { id: p.id }, data: { primaryImageUrl: primary, galleryImageUrls: gallery } });
      changed++;
    }
  }
  const variants = await prisma.variant.findMany({ where: { imageUrl: { startsWith: WP_UPLOADS } }, select: { id: true, imageUrl: true } });
  for (const v of variants) await prisma.variant.update({ where: { id: v.id }, data: { imageUrl: rewrite(v.imageUrl) } });
  const categories = await prisma.category.findMany({ where: { imageUrl: { startsWith: WP_UPLOADS } }, select: { id: true, imageUrl: true } });
  for (const c of categories) await prisma.category.update({ where: { id: c.id }, data: { imageUrl: rewrite(c.imageUrl) } });

  console.log(`[media] liens réécrits — produits: ${changed}, variantes: ${variants.length}, catégories: ${categories.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
