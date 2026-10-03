/**
 * Téléverse les images de catégories (`<slug>.jpg`) dans le bucket public `media`,
 * comme un téléversement normal : clé `YYYY/MM/<slug>.jpg`, ligne MediaAsset, Category.imageUrl.
 * Ne touche qu'aux catégories sans image, sauf --force.
 * Usage : yarn migrate:category-images <dossier> [--force]
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");
const dir = process.argv.slice(2).find((a) => !a.startsWith("--"));
const BUCKET = "media";

function dimensions(file: string): { width: number; height: number } {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], { encoding: "utf8" });
  const read = (key: string) => Number(out.match(new RegExp(`${key}: (\\d+)`))?.[1] ?? 0);
  return { width: read("pixelWidth"), height: read("pixelHeight") };
}

async function main() {
  if (!dir) throw new Error("Dossier des images requis");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/+$/, "");
  if (!url || !secret || !mediaBase) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY et NEXT_PUBLIC_MEDIA_BASE_URL requis");
  }
  if (!mediaBase.startsWith("https://")) throw new Error(`NEXT_PUBLIC_MEDIA_BASE_URL doit être publique en https : ${mediaBase}`);
  const supabase = createClient(url, secret, { auth: { persistSession: false } });

  const now = new Date();
  const prefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const files = readdirSync(resolve(dir)).filter((f) => f.endsWith(".jpg"));
  console.log(`[categories] ${files.length} images trouvées`);

  for (const file of files) {
    const slug = file.replace(/\.jpg$/, "");
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.log(`[categories]   ${slug} : catégorie introuvable, sauté`);
      continue;
    }
    if (category.imageUrl && !force) {
      console.log(`[categories]   ${slug} : a déjà une image, sauté`);
      continue;
    }

    const path = join(resolve(dir), file);
    const filePath = `${prefix}/${file}`;
    const publicUrl = `${mediaBase}/${filePath}`;
    const buf = readFileSync(path);
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, buf, { contentType: "image/jpeg", upsert: true });
    if (error) {
      console.log(`[categories]   ${slug} : ÉCHEC ${error.message}`);
      continue;
    }

    const data = {
      originalUrl: publicUrl,
      filePath,
      publicUrl,
      storageBucket: BUCKET,
      storagePath: filePath,
      title: category.name,
      altText: category.name,
      mimeType: "image/jpeg",
      ...dimensions(path),
      fileSize: statSync(path).size,
      downloadedAt: now,
    };
    const existing = await prisma.mediaAsset.findFirst({ where: { filePath } });
    if (existing) await prisma.mediaAsset.update({ where: { id: existing.id }, data });
    else await prisma.mediaAsset.create({ data });
    await prisma.category.update({ where: { id: category.id }, data: { imageUrl: publicUrl } });
    console.log(`[categories]   ${slug} : ok`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
