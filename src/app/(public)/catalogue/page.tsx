import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import {
  getPriceRange,
  getProductsByFilters,
  getTopLevelCategories,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Catalogue complet de fournitures de taxidermie : cervidés, oiseaux, mammifères, tannerie et accessoires.",
};

type SearchParams = Promise<{
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  page?: string;
}>;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const filters = {
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    inStock: sp.inStock === "1",
  };

  const [categories, priceRange, { products, total, pageCount }] = await Promise.all([
    getTopLevelCategories(),
    getPriceRange(),
    getProductsByFilters(filters, page, 24),
  ]);

  return (
    <>
      {/* Page header */}
      <Section spacing="md" divide="bottom">
        <Container size="wide">
          <Caption className="block mb-4">Index général</Caption>
          <Heading level="display" as="h1">
            Catalogue
          </Heading>
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            L’ensemble de nos fournitures et trophées, classés par catégorie. Filtrez par prix
            ou disponibilité pour affiner votre exploration.
          </p>
        </Container>
      </Section>

      {/* Categories overview */}
      <Section spacing="md" divide="bottom" className="bg-surface">
        <Container size="wide">
          <div className="flex items-baseline justify-between mb-10">
            <Caption>§ Catégories</Caption>
            <Caption>{categories.length} sections</Caption>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <li key={c.id}>
                <CategoryCard category={c} index={i} size="sm" />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Filters + products */}
      <Section spacing="lg">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-3">
              <CatalogFilters categories={categories} priceRange={priceRange} />
            </div>

            <div className="md:col-span-9">
              <div className="flex items-baseline justify-between mb-8">
                <Caption>
                  {total} {total === 1 ? "résultat" : "résultats"}
                </Caption>
                <Caption>
                  Page {page} / {pageCount}
                </Caption>
              </div>

              <ProductGrid products={products} startIndex={(page - 1) * 24} />

              {pageCount > 1 && <Pagination page={page} pageCount={pageCount} sp={sp} />}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Pagination({
  page,
  pageCount,
  sp,
}: {
  page: number;
  pageCount: number;
  sp: { minPrice?: string; maxPrice?: string; inStock?: string };
}) {
  function build(p: number) {
    const params = new URLSearchParams();
    if (sp.minPrice) params.set("minPrice", sp.minPrice);
    if (sp.maxPrice) params.set("maxPrice", sp.maxPrice);
    if (sp.inStock) params.set("inStock", sp.inStock);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  return (
    <nav className="mt-16 flex items-center justify-between border-t border-rule pt-6">
      <a
        href={page > 1 ? build(page - 1) : "#"}
        aria-disabled={page <= 1}
        className={
          page > 1
            ? "font-mono text-xs uppercase tracking-museum text-ink hover:text-ink-muted link-naturalist"
            : "font-mono text-xs uppercase tracking-museum text-ink-subtle pointer-events-none"
        }
      >
        ← Précédent
      </a>
      <Caption tone="strong">
        {page} · {pageCount}
      </Caption>
      <a
        href={page < pageCount ? build(page + 1) : "#"}
        aria-disabled={page >= pageCount}
        className={
          page < pageCount
            ? "font-mono text-xs uppercase tracking-museum text-ink hover:text-ink-muted link-naturalist"
            : "font-mono text-xs uppercase tracking-museum text-ink-subtle pointer-events-none"
        }
      >
        Suivant →
      </a>
    </nav>
  );
}
