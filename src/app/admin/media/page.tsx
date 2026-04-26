import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: any = {};
  if (sp.status === "downloaded") where.localPath = { not: null };
  if (sp.status === "pending") where.localPath = null;

  const [total, downloaded, pending, items] = await Promise.all([
    prisma.mediaAsset.count(),
    prisma.mediaAsset.count({ where: { localPath: { not: null } } }),
    prisma.mediaAsset.count({ where: { localPath: null } }),
    prisma.mediaAsset.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { wpPostId: "desc" },
    }),
  ]);

  const pages = Math.max(1, Math.ceil((sp.status ? (sp.status === "downloaded" ? downloaded : pending) : total) / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Médias</h1>
        <span className="text-sm text-gray-500">{total} total · {downloaded} téléchargés · {pending} en attente</span>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        <FilterLink href="/admin/media" current={!sp.status}>Tous</FilterLink>
        <FilterLink href="/admin/media?status=downloaded" current={sp.status === "downloaded"}>Téléchargés</FilterLink>
        <FilterLink href="/admin/media?status=pending" current={sp.status === "pending"}>En attente</FilterLink>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {items.map((m) => (
          <div key={m.id} className="rounded border border-gray-800 overflow-hidden">
            <div className="aspect-square bg-gray-900 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.localPath ? `/uploads/${m.filePath}` : m.originalUrl}
                alt={m.altText ?? ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {!m.localPath && (
                <span className="absolute top-1 right-1 rounded bg-amber-900/80 text-amber-200 px-1.5 py-0.5 text-[10px]">
                  remote
                </span>
              )}
            </div>
            <div className="p-2 text-xs text-gray-400 truncate" title={m.filePath}>{m.filePath}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 py-12">Aucun média.</div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 text-sm text-gray-400">Page {page} / {pages}</div>
      )}
    </div>
  );
}

function FilterLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  const cls = current ? "bg-blue-600 text-white" : "border border-gray-800 hover:bg-gray-900";
  return <a href={href} className={`px-3 py-1 rounded ${cls}`}>{children}</a>;
}
