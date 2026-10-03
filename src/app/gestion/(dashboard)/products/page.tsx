import Image from "next/image";
import type { Prisma, ProductStatus } from "@prisma/client";
import { Package, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { categoryOptions } from "@/lib/gestion/catalog";
import { money, STOCK_STATUS_LABEL } from "@/lib/gestion/format";
import { ProductStatusBadge, StockBadge } from "@/components/gestion/badges";
import {
  ButtonLink, EmptyState, FilterTabs, PageHeader, Pagination, RowLink, SearchBar, Table, Td, Th, inputClass, rowClass,
} from "@/components/gestion/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const STATUSES: ProductStatus[] = ["PUBLISHED", "DRAFT", "PRIVATE", "TRASH"];
const STATUS_TAB: Record<ProductStatus, string> = { PUBLISHED: "Publiés", DRAFT: "Brouillons", PRIVATE: "Privés", PENDING: "En attente", TRASH: "Corbeille" };

interface SearchParams { q?: string; page?: string; status?: string; stock?: string; categorie?: string }

export default async function ProductsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const status = STATUSES.find((s) => s === sp.status);
  const stock = ["instock", "outofstock", "onbackorder"].find((s) => s === sp.stock);
  const categoryId = Number(sp.categorie) || undefined;

  const where: Prisma.ProductWhereInput = status ? { status } : { status: { not: "TRASH" } };
  if (stock) where.stockStatus = stock;
  if (categoryId) where.categories = { some: { id: categoryId } };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, products, byStatus, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: [{ updatedAt: "desc" }],
      include: { _count: { select: { variants: true } }, categories: { select: { name: true }, take: 2 } },
    }),
    prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
    categoryOptions(),
  ]);
  const countOf = (s: ProductStatus) => byStatus.find((c) => c.status === s)?._count._all ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (params: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    const s = qs.toString();
    return `/gestion/products${s ? `?${s}` : ""}`;
  };
  const keep = { q, stock, categorie: categoryId ? String(categoryId) : undefined };

  return (
    <div>
      <PageHeader
        title="Produits"
        description={`${total} produit${total > 1 ? "s" : ""} dans cette vue`}
        actions={<ButtonLink href="/gestion/products/nouveau" icon={Plus}>Nouveau produit</ButtonLink>}
      />

      <FilterTabs
        items={[
          { href: href(keep), label: "Tous", count: byStatus.filter((c) => c.status !== "TRASH").reduce((n, c) => n + c._count._all, 0), current: !status },
          ...STATUSES.map((s) => ({ href: href({ ...keep, status: s }), label: STATUS_TAB[s], count: countOf(s), current: status === s })),
        ]}
      />

      <SearchBar action="/gestion/products" placeholder="Nom ou SKU" defaultValue={q}>
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <select name="categorie" defaultValue={categoryId ?? ""} aria-label="Catégorie" className={`${inputClass} sm:max-w-[220px]`}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{"  ".repeat(c.depth)}{c.name}</option>)}
        </select>
        <select name="stock" defaultValue={stock ?? ""} aria-label="Stock" className={`${inputClass} sm:max-w-[170px]`}>
          <option value="">Tout le stock</option>
          {Object.entries(STOCK_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </SearchBar>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit"
          description={q || stock || categoryId ? "Aucun résultat avec ces filtres." : "Commencez par créer un produit."}
          action={<ButtonLink href="/gestion/products/nouveau" icon={Plus}>Nouveau produit</ButtonLink>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Produit</Th>
              <Th className="hidden lg:table-cell">Catégorie</Th>
              <Th>Statut</Th>
              <Th className="hidden md:table-cell">Stock</Th>
              <Th className="text-right">Prix</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={rowClass}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-rule bg-bg-alt">
                      {p.primaryImageUrl ? <Image src={p.primaryImageUrl} alt="" fill sizes="44px" className="object-cover" /> : <Package className="m-3.5 h-4 w-4 text-ink-subtle" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <RowLink href={`/gestion/products/${p.id}`} label={`Modifier ${p.name}`}>
                        <span className="line-clamp-1 font-medium text-ink">{p.name}</span>
                      </RowLink>
                      <span className="block text-xs text-ink-muted">
                        {[p.sku ? `SKU ${p.sku}` : null, p._count.variants ? `${p._count.variants} variante${p._count.variants > 1 ? "s" : ""}` : null, p.featured ? "Vedette" : null].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </div>
                  </div>
                </Td>
                <Td className="hidden max-w-[200px] truncate text-ink-muted lg:table-cell">{p.categories.map((c) => c.name).join(", ") || "—"}</Td>
                <Td><ProductStatusBadge status={p.status} /></Td>
                <Td className="hidden md:table-cell"><StockBadge status={p.stockStatus} quantity={p.manageStock ? p.stockQuantity : null} /></Td>
                <Td className="whitespace-nowrap text-right font-mono tabular-nums text-ink">
                  {p._count.variants && p.price ? <span className="text-xs text-ink-muted">dès </span> : null}
                  {money(p.price)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Pagination page={page} pages={pages} hrefFor={(n) => href({ ...keep, status, page: String(n) })} />
    </div>
  );
}
