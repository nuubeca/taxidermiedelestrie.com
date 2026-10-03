import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Film, ImageOff, Images } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fileSize } from "@/lib/gestion/format";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchBar, Table, Td, Th } from "@/components/gestion/ui";
import { MediaUploader } from "./MediaUploader";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;
const SIGNED_URL_TTL = 60 * 60;

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ page?: string; vue?: string; q?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const view = sp.vue === "videos" ? "videos" : "images";
  const q = sp.q?.trim() ?? "";

  const isVideo: Prisma.MediaAssetWhereInput = { OR: [{ mimeType: { startsWith: "video/" } }, { storageBucket: "videos" }] };
  // Les vidéos sont dans le bucket privé (publicUrl null) ; mimeType est souvent vide pour les fichiers WordPress.
  const isImage: Prisma.MediaAssetWhereInput = {
    publicUrl: { not: null },
    OR: [{ mimeType: null }, { NOT: { mimeType: { startsWith: "video/" } } }],
  };
  const search: Prisma.MediaAssetWhereInput = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { filePath: { contains: q, mode: "insensitive" } }, { altText: { contains: q, mode: "insensitive" } }] }
    : {};
  const where: Prisma.MediaAssetWhereInput = { AND: [view === "videos" ? isVideo : isImage, search] };

  const [images, videos, total, items] = await Promise.all([
    prisma.mediaAsset.count({ where: isImage }),
    prisma.mediaAsset.count({ where: isVideo }),
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({ where, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Liens signés pour les vidéos privées (lecture depuis la gestion seulement).
  const signed = new Map<number, string>();
  if (view === "videos") {
    const supabase = createSupabaseAdminClient();
    await Promise.all(
      items.filter((m) => m.storageBucket && m.storagePath).map(async (m) => {
        const { data } = await supabase.storage.from(m.storageBucket!).createSignedUrl(m.storagePath!, SIGNED_URL_TTL);
        if (data?.signedUrl) signed.set(m.id, data.signedUrl);
      }),
    );
  }

  const href = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => Boolean(e[1]))).toString();
    return `/gestion/media${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Médiathèque" description="Images du site, servies depuis le Storage. Cliquez une image pour la renommer ou la supprimer." />

      <FilterTabs
        items={[
          { href: href({ q }), label: "Images", count: images, current: view === "images" },
          { href: href({ q, vue: "videos" }), label: "Vidéos privées", count: videos, current: view === "videos" },
        ]}
      />

      {view === "images" ? <MediaUploader /> : null}

      <SearchBar action="/gestion/media" placeholder="Nom de fichier, titre ou texte alternatif" defaultValue={q}>
        {view === "videos" ? <input type="hidden" name="vue" value="videos" /> : null}
      </SearchBar>

      {items.length === 0 ? (
        <EmptyState icon={view === "videos" ? Film : ImageOff} title={view === "videos" ? "Aucune vidéo" : "Aucune image"} />
      ) : view === "videos" ? (
        <>
          <p className="mb-4 max-w-3xl text-sm text-ink-muted">
            Cours de tannage et de montage vendus en DVD. Fichiers privés : les liens expirent après une heure et ne fonctionnent que depuis la gestion.
          </p>
          <Table>
            <thead>
              <tr><Th>Fichier</Th><Th className="hidden md:table-cell">Titre</Th><Th className="text-right">Taille</Th><Th className="text-right">Accès</Th></tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const url = signed.get(m.id);
                return (
                  <tr key={m.id}>
                    <Td className="font-mono text-xs text-ink">{m.filePath}</Td>
                    <Td className="hidden text-ink-muted md:table-cell">{m.title ?? "—"}</Td>
                    <Td className="text-right font-mono tabular-nums text-ink-muted">{fileSize(m.fileSize)}</Td>
                    <Td className="text-right">
                      {url ? (
                        <span className="inline-flex gap-4">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">Lire</a>
                          <a href={`${url}&download=`} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">Télécharger</a>
                        </span>
                      ) : (
                        <span className="text-terracotta">non transférée</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <li key={m.id}>
              <Link href={`/gestion/media/${m.id}`} className="group block overflow-hidden rounded-xl border border-rule bg-surface transition-colors hover:border-ink-subtle">
                <div className="relative aspect-square bg-bg-alt">
                  <Image src={m.publicUrl!} alt={m.altText ?? ""} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw" className="object-cover" />
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs text-ink" title={m.title ?? m.filePath}>{m.title ?? m.filePath.split("/").pop()}</p>
                  <p className="text-[11px] text-ink-muted">{m.width && m.height ? `${m.width}×${m.height} · ` : ""}{fileSize(m.fileSize)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pages={pages} hrefFor={(n) => href({ q, vue: view === "videos" ? "videos" : undefined, page: String(n) })} />
      {view === "images" && images === 0 ? <p className="mt-4 text-sm text-ink-muted"><Images className="mr-1 inline h-4 w-4" aria-hidden />Glissez des images ci-dessus pour commencer.</p> : null}
    </div>
  );
}
