import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface SearchParams {
  q?: string;
  page?: string;
  type?: string;
  status?: string;
}

export default async function ProductsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sp.type) where.type = sp.type;
  if (sp.status) where.status = sp.status;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      take: PAGE_SIZE,
      skip,
      orderBy: { wpModifiedAt: "desc" },
      include: {
        _count: { select: { variants: true } },
        categories: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <span className="text-sm text-gray-500">{total} résultat{total > 1 ? "s" : ""}</span>
      </div>

      <form className="mb-4 flex gap-2" action="/admin/products" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher (nom, SKU, slug)…"
          className="flex-1 rounded border border-gray-800 bg-gray-900 px-3 py-2 text-sm"
        />
        <select name="type" defaultValue={sp.type ?? ""} className="rounded border border-gray-800 bg-gray-900 px-3 py-2 text-sm">
          <option value="">Tous types</option>
          <option value="SIMPLE">SIMPLE</option>
          <option value="VARIABLE">VARIABLE</option>
          <option value="GROUPED">GROUPED</option>
          <option value="EXTERNAL">EXTERNAL</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border border-gray-800 bg-gray-900 px-3 py-2 text-sm">
          <option value="">Tous statuts</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PRIVATE">PRIVATE</option>
          <option value="TRASH">TRASH</option>
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500">
          Filtrer
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Nom</th>
              <th className="text-left px-4 py-2">SKU</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Statut</th>
              <th className="text-right px-4 py-2">Prix</th>
              <th className="text-right px-4 py-2">Stock</th>
              <th className="text-right px-4 py-2">Variations</th>
              <th className="text-left px-4 py-2">Catégories</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-900/50">
                <td className="px-4 py-2 text-gray-500">{p.wpPostId}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/products/${p.id}`} className="text-blue-400 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-400">{p.sku || "—"}</td>
                <td className="px-4 py-2"><Badge>{p.type}</Badge></td>
                <td className="px-4 py-2"><Badge>{p.status}</Badge></td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {p.price ? `${p.price.toString()} $` : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {p.manageStock ? (p.stockQuantity ?? 0) : <span className="text-gray-500">{p.stockStatus}</span>}
                </td>
                <td className="px-4 py-2 text-right text-gray-400">{p._count.variants}</td>
                <td className="px-4 py-2 text-xs text-gray-400 max-w-xs truncate">
                  {p.categories.map((c) => c.name).join(", ") || "—"}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Aucun produit. Lancez la migration: <code>npm run migrate:all</code></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/admin/products?${new URLSearchParams({ ...sp, page: String(page - 1) } as any)}`} className="px-3 py-1 rounded border border-gray-800 hover:bg-gray-900">← Précédent</Link>
          )}
          <span className="text-gray-500">Page {page} / {pages}</span>
          {page < pages && (
            <Link href={`/admin/products?${new URLSearchParams({ ...sp, page: String(page + 1) } as any)}`} className="px-3 py-1 rounded border border-gray-800 hover:bg-gray-900">Suivant →</Link>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded bg-gray-800 px-2 py-0.5 text-xs">{children}</span>;
}
