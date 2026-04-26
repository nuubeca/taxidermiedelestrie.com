import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      categories: true,
      tags: true,
      attributes: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
    },
  });
  if (!product) notFound();

  return (
    <div className="max-w-5xl">
      <Link href="/admin/products" className="text-sm text-gray-400 hover:underline">← Retour</Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">{product.name}</h1>
      <p className="text-xs text-gray-500 mb-6">
        WP ID {product.wpPostId} · slug <code>{product.slug}</code> · {product.type} · {product.status}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {product.primaryImageUrl && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.primaryImageUrl} alt={product.name} className="rounded border border-gray-800 max-h-72" />
            </div>
          )}

          <Section title="Description">
            {product.description ? (
              <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </Section>

          <Section title={`Attributs (${product.attributes.length})`}>
            {product.attributes.length === 0 ? <p className="text-sm text-gray-500">Aucun</p> : (
              <ul className="space-y-2 text-sm">
                {product.attributes.map((a) => (
                  <li key={a.id} className="rounded border border-gray-800 p-3">
                    <div className="font-medium">{a.name} <span className="text-gray-500 text-xs">({a.slug})</span></div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {a.options.map((o) => (
                        <span key={o} className="rounded bg-gray-800 px-2 py-0.5 text-xs">{o}</span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {a.isVisible ? "visible" : "masqué"} · {a.isVariation ? "pilote variations" : "info"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Variations (${product.variants.length})`}>
            {product.variants.length === 0 ? <p className="text-sm text-gray-500">Aucune</p> : (
              <div className="overflow-x-auto rounded border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Attributs</th>
                      <th className="text-right px-3 py-2">Prix</th>
                      <th className="text-right px-3 py-2">Stock</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className="border-t border-gray-800">
                        <td className="px-3 py-2 text-gray-400">{v.sku || "—"}</td>
                        <td className="px-3 py-2 text-xs">
                          {Object.entries(v.attributes as Record<string, string>).map(([k, val]) => (
                            <span key={k} className="mr-2">
                              <span className="text-gray-500">{k}:</span> {val}
                            </span>
                          ))}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.price ? `${v.price.toString()} $` : "—"}</td>
                        <td className="px-3 py-2 text-right">
                          {v.manageStock ? (v.stockQuantity ?? 0) : <span className="text-gray-500">{v.stockStatus}</span>}
                        </td>
                        <td className="px-3 py-2 text-xs">{v.enabled ? "actif" : "désactivé"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {product.galleryImageUrls.length > 0 && (
            <Section title={`Galerie (${product.galleryImageUrls.length})`}>
              <div className="grid grid-cols-4 gap-2">
                {product.galleryImageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="rounded border border-gray-800 aspect-square object-cover" />
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-6">
          <Section title="Prix & stock">
            <dl className="text-sm space-y-1">
              <Row label="Prix" value={product.price ? `${product.price.toString()} $` : "—"} />
              <Row label="Prix régulier" value={product.regularPrice ? `${product.regularPrice.toString()} $` : "—"} />
              <Row label="Prix soldé" value={product.salePrice ? `${product.salePrice.toString()} $` : "—"} />
              <Row label="SKU" value={product.sku ?? "—"} />
              <Row label="Stock géré" value={product.manageStock ? "oui" : "non"} />
              <Row label="Quantité" value={product.stockQuantity?.toString() ?? "—"} />
              <Row label="Statut stock" value={product.stockStatus} />
            </dl>
          </Section>

          <Section title="Catégories">
            {product.categories.length === 0 ? <p className="text-sm text-gray-500">—</p> : (
              <ul className="text-sm space-y-1">
                {product.categories.map((c) => <li key={c.id}>{c.name}</li>)}
              </ul>
            )}
          </Section>

          <Section title="Tags">
            {product.tags.length === 0 ? <p className="text-sm text-gray-500">—</p> : (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((t) => <span key={t.id} className="rounded bg-gray-800 px-2 py-0.5 text-xs">{t.name}</span>)}
              </div>
            )}
          </Section>

          <Section title="Dimensions">
            <dl className="text-sm space-y-1">
              <Row label="Poids" value={product.weight ? `${product.weight.toString()} kg` : "—"} />
              <Row label="L × l × H" value={product.length || product.width || product.height ? `${product.length ?? "?"} × ${product.width ?? "?"} × ${product.height ?? "?"} cm` : "—"} />
            </dl>
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
