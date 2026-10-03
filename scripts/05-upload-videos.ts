/**
 * Transfère les vidéos WordPress dans le bucket PRIVÉ `videos` de Supabase Storage.
 * Ces fichiers sont des cours vendus (DVD) : jamais en accès public.
 * Idempotent : saute les assets déjà dans le bucket sauf --force.
 * Usage : yarn migrate:videos [--force]
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");
const BUCKET = "videos";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY requis");
  const supabase = createClient(url, secret, { auth: { persistSession: false } });

  const videos = await prisma.mediaAsset.findMany({
    where: {
      OR: [{ mimeType: { startsWith: "video/" } }, { filePath: { endsWith: ".m4v" } }, { filePath: { endsWith: ".mov" } }, { filePath: { endsWith: ".mp4" } }],
      ...(force ? {} : { storageBucket: null }),
    },
    orderBy: { fileSize: "asc" },
  });
  console.log(`[videos] ${videos.length} vidéos à transférer`);

  for (const v of videos) {
    const mb = ((v.fileSize ?? 0) / 1048576).toFixed(0);
    process.stdout.write(`[videos]   ${v.filePath} (${mb} Mo) … `);
    try {
      const res = await fetch(v.originalUrl, { headers: { "User-Agent": "Mouldec-Migration/1.0 (+max@pelti.co)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? v.mimeType ?? "video/mp4";
      const { error } = await supabase.storage.from(BUCKET).upload(v.filePath, buf, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      // Si une petite vidéo était passée dans le bucket public, on l'en retire.
      if (v.publicUrl) await supabase.storage.from("media").remove([v.filePath]);
      await prisma.mediaAsset.update({
        where: { id: v.id },
        data: { storageBucket: BUCKET, storagePath: v.filePath, publicUrl: null, fileSize: buf.length, downloadedAt: new Date() },
      });
      console.log("ok");
    } catch (e) {
      console.log(`ÉCHEC: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
