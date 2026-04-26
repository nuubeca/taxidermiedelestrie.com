import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import {
  getCategoryBySlug,
  getPriceRange,
  getProductsByFilters,
  getTopLevelCategories,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string }>;
type SearchParams = Promise<{
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  page?: string;
}>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: cat.name,
    description: cat.description ?? `Découvrez nos pièces dans la catégorie ${cat.name}.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const filters = {
    categorySlug: category,
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
          <nav className="flex items-center gap-2 mb-6 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
            <Link href="/catalogue" className="hover:text-ink link-naturalist">
              Catalogue
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{cat.name}</span>
          </nav>

          <Heading level="display" as="h1">
            {cat.name}
          </Heading>

          {cat.description ? (
            <p className="mt-6 max-w-2xl text-lead text-ink-muted">{cat.description}</p>
          ) : (
            <p className="mt-6 max-w-2xl text-lead text-ink-muted">
              {cat.productCount} {cat.productCount === 1 ? "pièce" : "pièces"} disponibles dans
              cette section du catalogue.
            </p>
          )}
        </Container>
      </Section>

      {/* Filters + products */}
      <Section spacing="lg">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-3">
              <CatalogFilters
                categories={categories}
                activeCategory={category}
                priceRange={priceRange}
              />
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

              {pageCount > 1 && (
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  basePath={`/catalogue/${category}`}
                  sp={sp}
                />
              )}
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
  basePath,
  sp,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  sp: { minPrice?: string; maxPrice?: string; inStock?: string };
}) {
  function build(p: number) {
    const params = new URLSearchParams();
    if (sp.minPrice) params.set("minPrice", sp.minPrice);
    if (sp.maxPrice) params.set("maxPrice", sp.maxPrice);
    if (sp.inStock) params.set("inStock", sp.inStock);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <nav className="mt-16 flex items-center justify-between border-t border-rule pt-6">
      <a
        href={page > 1 ? build(page - 1) : "#"}
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
