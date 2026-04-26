/**
 * Télécharge les médias depuis WordPress live vers public/uploads/.
 *
 * NON EXÉCUTÉ par défaut — c'est la dernière étape de la migration et elle
 * doit tourner depuis l'environnement final.
 *
 * Lit MediaAsset depuis la DB, fetch chaque originalUrl, sauvegarde sous
 * public/uploads/<filePath>. Préserve l'arborescence YYYY/MM de WordPress.
 *
 * Idempotent: les médias déjà téléchargés (localPath != null) sont sautés
 * sauf si --force est passé.
 *
 * Usage:
 *   npm run migrate:media
 *   npm run migrate:media -- --force
 *   npm run migrate:media -- --concurrency=5 --rate=200
 */

import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const concurrency = parseArg("--concurrency", 4);
const rateMs = parseArg("--rate", 250); // délai minimum entre requêtes
const downloadDir = resolve(process.cwd(), process.env.MEDIA_DOWNLOAD_DIR ?? "./public/uploads");

function parseArg(name: string, fallback: number): number {
  const arg = [...args].find((a) => a.startsWith(`${name}=`));
  if (!arg) return fallback;
  const v = parseInt(arg.split("=")[1], 10);
  return Number.isFinite(v) ? v : fallback;
}

async function fetchOne(url: string, dest: string, attempt = 1): Promise<{ ok: boolean; size: number; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mouldec-Migration/1.0 (+max@pelti.co)" },
    });
    if (!res.ok) {
      if (res.status === 404) return { ok: false, size: 0, error: `404 Not Found` };
      if (attempt < 3 && (res.status >= 500 || res.status === 429)) {
        await sleep(1000 * attempt);
        return fetchOne(url, dest, attempt + 1);
      }
      return { ok: false, size: 0, error: `HTTP ${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    return { ok: true, size: buf.length };
  } catch (e: any) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return fetchOne(url, dest, attempt + 1);
    }
    return { ok: false, size: 0, error: e?.message ?? String(e) };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Worker pool simple
async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  const queue = items.map((it, i) => ({ it, i }));
  async function worker() {
    while (queue.length) {
      const { it, i } = queue.shift()!;
      await fn(it, i);
      if (rateMs > 0) await sleep(rateMs);
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
}

async function main() {
  const where = force ? {} : { localPath: null };
  const total = await prisma.mediaAsset.count({ where });
  console.log(`[media] ${total} assets à télécharger (force=${force}, concurrency=${concurrency}, rate=${rateMs}ms)`);
  console.log(`[media] Destination: ${downloadDir}`);

  if (total === 0) {
    console.log("[media] Rien à faire.");
    return;
  }

  const run = await prisma.migrationRun.create({
    data: { step: "media", itemsTotal: total },
  });

  const assets = await prisma.mediaAsset.findMany({ where });
  let ok = 0;
  let failed = 0;
  const failures: Array<{ url: string; error: string }> = [];

  await pool(assets, concurrency, async (a, i) => {
    if (!a.originalUrl || !a.filePath) {
      failed++;
      failures.push({ url: a.originalUrl, error: "missing originalUrl or filePath" });
      return;
    }
    const dest = resolve(downloadDir, a.filePath);
    if (!force && existsSync(dest)) {
      // Marquer comme téléchargé sans refetch
      await prisma.mediaAsset.update({
        where: { id: a.id },
        data: { localPath: a.filePath, downloadedAt: new Date() },
      });
      ok++;
      return;
    }
    const result = await fetchOne(a.originalUrl, dest);
    if (result.ok) {
      ok++;
      await prisma.mediaAsset.update({
        where: { id: a.id },
        data: { localPath: a.filePath, downloadedAt: new Date(), fileSize: result.size },
      });
    } else {
      failed++;
      failures.push({ url: a.originalUrl, error: result.error ?? "unknown" });
    }
    if ((i + 1) % 25 === 0) console.log(`[media]   ${i + 1}/${total} (ok=${ok} fail=${failed})`);
  });

  await prisma.migrationRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      itemsOk: ok,
      itemsFailed: failed,
      notes: failures.length ? JSON.stringify(failures.slice(0, 50)) : "ok",
    },
  });

  console.log(`\n[media] === DONE ===`);
  console.log(`  ok:     ${ok}`);
  console.log(`  failed: ${failed}`);
  if (failures.length) {
    console.log(`  Premiers échecs:`);
    for (const f of failures.slice(0, 10)) console.log(`   - ${f.url}  →  ${f.error}`);
  }
}

main()
  .catch((e) => {
    console.error("[media] FATAL", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
