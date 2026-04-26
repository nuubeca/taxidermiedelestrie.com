import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { VariantSelector } from "@/components/catalog/VariantSelector";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  getCategoryBySlug,
  getProductBySlug,
  getProductsByFilters,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.metaTitle ?? product.name,
    description:
      product.metaDescription ??
      product.shortDescription ??
      `Découvrez ${product.name} — Taxidermie de l'Estrie.`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { category, slug } = await params;
  const [product, cat] = await Promise.all([
    getProductBySlug(slug),
    getCategoryBySlug(category),
  ]);

  if (!product) notFound();

  // Related products
  const { products: related } = await getProductsByFilters(
    { categorySlug: category },
    1,
    5,
  );
  const relatedFiltered = related.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <>
      {/* Breadcrumb */}
      <Section spacing="sm" divide="bottom">
        <Container size="wide">
          <nav className="flex flex-wrap items-center gap-2 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
            <Link href="/catalogue" className="hover:text-ink link-naturalist">
              Catalogue
            </Link>
            <span aria-hidden="true">/</span>
            {cat ? (
              <>
                <Link href={`/catalogue/${cat.slug}`} className="hover:text-ink link-naturalist">
                  {cat.name}
                </Link>
                <span aria-hidden="true">/</span>
              </>
            ) : null}
            <span className="text-ink truncate max-w-[40ch]">{product.name}</span>
          </nav>
        </Container>
      </Section>

      {/* Detail */}
      <Section spacing="lg">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            {/* Gallery */}
            <div className="md:col-span-7">
              <ProductGallery
                primary={product.primaryImageUrl}
                gallery={product.galleryImageUrls}
                alt={product.name}
              />
            </div>

            {/* Info */}
            <div className="md:col-span-5 md:sticky md:top-32 md:self-start">
              {product.featured && (
                <Caption className="block mb-4 text-ochre">★ Sélection de l’atelier</Caption>
              )}
              <Heading level="h1" as="h1">
                {product.name}
              </Heading>

              {product.shortDescription && (
                <p className="mt-6 text-lead text-ink-muted">{product.shortDescription}</p>
              )}

              <div className="mt-8">
                <VariantSelector
                  attributes={product.attributes}
                  variants={product.variants}
                  basePrice={product.price}
                  baseStockStatus={product.stockStatus}
                />
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-rule pt-6">
                  <Caption>Mots-clés</Caption>
                  {product.tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="font-mono text-xs text-ink-muted"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Description + Specs */}
      {(product.description || hasSpecs(product)) && (
        <Section spacing="lg" divide="top" className="bg-surface">
          <Container size="wide">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
              {product.description && (
                <div className="md:col-span-7">
                  <Caption className="block mb-6">Description</Caption>
                  <article
                    className="prose-naturalist max-w-prose text-base leading-relaxed text-ink"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              {hasSpecs(product) && (
                <aside className="md:col-span-4 md:col-start-9">
                  <Caption className="block mb-6">Fiche technique</Caption>
                  <dl className="flex flex-col">
                    <SpecRow label="Référence" value={product.sku} />
                    <SpecRow
                      label="Type"
                      value={
                        product.type === "VARIABLE"
                          ? "Avec variations"
                          : product.type === "GROUPED"
                            ? "Groupé"
                            : "Simple"
                      }
                    />
                    <SpecRow
                      label="Poids"
                      value={product.weight ? `${product.weight} kg` : null}
                    />
                    <SpecRow
                      label="Dimensions"
                      value={
                        product.length || product.width || product.height
                          ? `${product.length ?? "—"} × ${product.width ?? "—"} × ${product.height ?? "—"} cm`
                          : null
                      }
                    />
                    <SpecRow
                      label="Catégories"
                      value={product.fullCategories.map((c) => c.name).join(" · ") || null}
                    />
                  </dl>
                </aside>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* Related */}
      {relatedFiltered.length > 0 && (
        <Section spacing="lg" divide="top">
          <Container size="wide">
            <div className="flex items-baseline justify-between mb-12">
              <div>
                <Caption className="block mb-4">Dans la même catégorie</Caption>
                <Heading level="h2">Vous aimerez aussi</Heading>
              </div>
              {cat && (
                <Button href={`/catalogue/${cat.slug}`} variant="link">
                  Tout voir ↗
                </Button>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
              {relatedFiltered.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} index={i} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}

function hasSpecs(p: { sku: string | null; weight: number | null; length: number | null; width: number | null; height: number | null; fullCategories: unknown[] }) {
  return Boolean(p.sku || p.weight || p.length || p.width || p.height || p.fullCategories.length > 0);
}

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-rule py-3">
      <dt className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle col-span-1">
        {label}
      </dt>
      <dd className="text-sm text-ink col-span-2">{value}</dd>
    </div>
  );
}
