import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [products, variants, categories, tags, attributes, media, mediaDownloaded, lastRun] = await Promise.all([
    prisma.product.count(),
    prisma.variant.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.productAttribute.count(),
    prisma.mediaAsset.count(),
    prisma.mediaAsset.count({ where: { localPath: { not: null } } }),
    prisma.migrationRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

  const productsByType = await prisma.product.groupBy({
    by: ["type"],
    _count: { type: true },
  });
  const productsByStatus = await prisma.product.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return {
    products,
    variants,
    categories,
    tags,
    attributes,
    media,
    mediaDownloaded,
    lastRun,
    productsByType,
    productsByStatus,
  };
}

function Card({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-800 p-5">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Produits" value={s.products} />
        <Card label="Variations" value={s.variants} />
        <Card label="Catégories" value={s.categories} />
        <Card label="Tags" value={s.tags} />
        <Card label="Attributs" value={s.attributes} hint="locaux par produit" />
        <Card
          label="Médias"
          value={s.media}
          hint={`${s.mediaDownloaded} téléchargés (${Math.round((s.mediaDownloaded / Math.max(1, s.media)) * 100)}%)`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-lg border border-gray-800 p-5">
          <h2 className="font-medium mb-3">Produits par type</h2>
          {s.productsByType.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun produit. Lancez la migration.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {s.productsByType.map((r) => (
                <li key={r.type} className="flex justify-between">
                  <span>{r.type}</span>
                  <span className="text-gray-400">{r._count.type}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-gray-800 p-5">
          <h2 className="font-medium mb-3">Produits par statut</h2>
          {s.productsByStatus.length === 0 ? (
            <p className="text-sm text-gray-500">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {s.productsByStatus.map((r) => (
                <li key={r.status} className="flex justify-between">
                  <span>{r.status}</span>
                  <span className="text-gray-400">{r._count.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {s.lastRun && (
        <section className="mt-8 rounded-lg border border-gray-800 p-5">
          <h2 className="font-medium mb-2">Dernière exécution de migration</h2>
          <dl className="text-sm grid grid-cols-2 gap-2">
            <dt className="text-gray-500">Étape</dt><dd>{s.lastRun.step}</dd>
            <dt className="text-gray-500">Démarrée</dt><dd>{s.lastRun.startedAt.toISOString()}</dd>
            <dt className="text-gray-500">Terminée</dt><dd>{s.lastRun.finishedAt?.toISOString() ?? "en cours"}</dd>
            <dt className="text-gray-500">OK / Total</dt><dd>{s.lastRun.itemsOk} / {s.lastRun.itemsTotal}</dd>
            <dt className="text-gray-500">Échecs</dt><dd>{s.lastRun.itemsFailed}</dd>
          </dl>
          {s.lastRun.notes && <p className="mt-3 text-xs text-gray-500 truncate">{s.lastRun.notes}</p>}
        </section>
      )}
    </div>
  );
}
