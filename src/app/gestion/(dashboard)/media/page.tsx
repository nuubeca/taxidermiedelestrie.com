import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;
const SIGNED_URL_TTL = 60 * 60; // 1 h

type Status = "videos" | "stored" | "pending" | undefined;

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} Mo`;
  return `${(bytes / 1024).toFixed(0)} Ko`;
}

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const status = (["videos", "stored", "pending"] as const).find((s) => s === sp.status) as Status;

  const isVideo: Prisma.MediaAssetWhereInput = { OR: [{ mimeType: { startsWith: "video/" } }, { storageBucket: "videos" }] };
  const where: Prisma.MediaAssetWhereInput =
    status === "videos" ? isVideo
    : status === "stored" ? { publicUrl: { not: null } }
    : status === "pending" ? { publicUrl: null, storageBucket: null }
    : {};

  const [total, stored, videos, pending, items] = await Promise.all([
    prisma.mediaAsset.count(),
    prisma.mediaAsset.count({ where: { publicUrl: { not: null } } }),
    prisma.mediaAsset.count({ where: isVideo }),
    prisma.mediaAsset.count({ where: { publicUrl: null, storageBucket: null } }),
    prisma.mediaAsset.findMany({ where, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, orderBy: { wpPostId: "desc" } }),
  ]);
  const filteredTotal = status === "videos" ? videos : status === "stored" ? stored : status === "pending" ? pending : total;
  const pages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  // Liens signés pour les fichiers privés (lecture et téléchargement depuis la gestion seulement).
  const signed = new Map<number, string>();
  const privateItems = items.filter((m) => m.storageBucket && m.storagePath);
  if (privateItems.length > 0) {
    const supabase = createSupabaseAdminClient();
    await Promise.all(
      privateItems.map(async (m) => {
        const { data } = await supabase.storage.from(m.storageBucket!).createSignedUrl(m.storagePath!, SIGNED_URL_TTL);
        if (data?.signedUrl) signed.set(m.id, data.signedUrl);
      }),
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Médias</h1>
        <span className="text-sm text-neutral-500">
          {total} total · {stored} dans le Storage · {videos} vidéos (privées) · {pending} non transférés
        </span>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        <FilterLink href="/gestion/media" current={!status}>Tous</FilterLink>
        <FilterLink href="/gestion/media?status=stored" current={status === "stored"}>Images</FilterLink>
        <FilterLink href="/gestion/media?status=videos" current={status === "videos"}>Vidéos</FilterLink>
        <FilterLink href="/gestion/media?status=pending" current={status === "pending"}>Non transférés</FilterLink>
      </div>

      {status === "videos" ? (
        <>
          <p className="mb-4 text-sm text-neutral-400 max-w-3xl">
            Cours de tannage et de montage vendus en DVD (produit « DVD sur le tannage et la taxidermie »). Fichiers privés :
            les liens ci-dessous expirent après une heure et ne sont visibles que dans la gestion.
          </p>
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500 border-b border-neutral-800">
              <tr><th className="py-2">Fichier</th><th>Titre WordPress</th><th>Type</th><th className="text-right">Taille</th><th className="text-right">Accès</th></tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const url = signed.get(m.id);
                return (
                  <tr key={m.id} className="border-b border-neutral-900">
                    <td className="py-2 font-mono text-xs">{m.filePath}</td>
                    <td>{m.title ?? "—"}</td>
                    <td className="text-neutral-500">{m.mimeType ?? "—"}</td>
                    <td className="text-right font-mono">{formatSize(m.fileSize)}</td>
                    <td className="text-right">
                      {url ? (
                        <span className="inline-flex gap-3">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Lire</a>
                          <a href={`${url}&download=`} className="text-blue-400 hover:underline">Télécharger</a>
                        </span>
                      ) : (
                        <span className="text-amber-400">non transférée</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {items.map((m) => {
            const isVid = m.mimeType?.startsWith("video/") || m.storageBucket === "videos";
            return (
              <div key={m.id} className="rounded border border-neutral-800 overflow-hidden">
                <div className="aspect-square bg-neutral-900 relative">
                  {isVid ? (
                    <Link href="/gestion/media?status=videos" className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400 hover:text-neutral-200">
                      Vidéo · {formatSize(m.fileSize)}
                    </Link>
                  ) : m.publicUrl ? (
                    <Image src={m.publicUrl} alt={m.altText ?? ""} fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-300">non transféré</span>
                  )}
                </div>
                <div className="p-2 text-xs text-neutral-400 truncate" title={m.filePath}>{m.filePath}</div>
              </div>
            );
          })}
          {items.length === 0 ? <div className="col-span-full text-center text-sm text-neutral-500 py-12">Aucun média.</div> : null}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex gap-2 mt-6 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={{ pathname: "/gestion/media", query: { ...(status ? { status } : {}), page: p } }} className={p === page ? "px-3 py-1 bg-neutral-200 text-neutral-900 rounded" : "px-3 py-1 bg-neutral-900 rounded"}>{p}</Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilterLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  const cls = current ? "bg-neutral-200 text-neutral-900" : "border border-neutral-800 hover:bg-neutral-900";
  return <Link href={href} className={`px-3 py-1 rounded ${cls}`}>{children}</Link>;
}
