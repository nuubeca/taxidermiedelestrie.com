import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, ExternalLink, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { categoryOptions, tagOptions } from "@/lib/gestion/catalog";
import { shortDate } from "@/lib/gestion/format";
import { ProductStatusBadge } from "@/components/gestion/badges";
import { ActionButton, ConfirmButton } from "@/components/gestion/forms";
import { PageHeader, buttonClass } from "@/components/gestion/ui";
import { deleteProduct, duplicateProduct, restoreProduct, trashProduct, updateProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

const dec = (v: { toString: () => string } | null) => (v === null ? "" : v.toString());

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> }) {
  const { id } = await params;
  const { cree } = await searchParams;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, categories, tags] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: { select: { id: true, slug: true } },
        tags: { select: { id: true } },
        attributes: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
      },
    }),
    categoryOptions(),
    tagOptions(),
  ]);
  if (!product) notFound();

  const keyOf = new Map(product.attributes.map((a) => [a.slug, `a${a.id}`]));
  const publicHref = product.categories[0] ? `/catalogue/${product.categories[0].slug}/${product.slug}` : null;
  const trashed = product.status === "TRASH";

  return (
    <div>
      <PageHeader
        back={{ href: "/gestion/products", label: "Produits" }}
        title={<span className="flex flex-wrap items-center gap-3"><span className="truncate">{product.name}</span><ProductStatusBadge status={product.status} /></span>}
        description={`${cree ? "Produit créé. " : ""}Modifié le ${shortDate(product.updatedAt)} · ${product.totalSales} vente${product.totalSales > 1 ? "s" : ""}${product.wpPostId ? ` · WordPress #${product.wpPostId}` : ""}`}
        actions={
          <>
            {publicHref && product.status === "PUBLISHED" ? (
              <Link href={publicHref} target="_blank" className={buttonClass.secondary}>
                <ExternalLink className="h-4 w-4" aria-hidden /> Voir sur le site
              </Link>
            ) : null}
            <ActionButton action={duplicateProduct.bind(null, product.id)} icon={<Copy className="h-4 w-4" aria-hidden />}>Dupliquer</ActionButton>
            {trashed ? (
              <>
                <ActionButton action={restoreProduct.bind(null, product.id)} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>Restaurer</ActionButton>
                <ConfirmButton onConfirm={deleteProduct.bind(null, product.id)} label="Supprimer" confirmLabel="Supprimer définitivement" />
              </>
            ) : (
              <ConfirmButton onConfirm={trashProduct.bind(null, product.id)} label="Corbeille" confirmLabel="Mettre à la corbeille" />
            )}
          </>
        }
      />
      <ProductForm
        version={product.updatedAt.toISOString()}
        action={updateProduct}
        submitLabel="Enregistrer"
        categories={categories}
        tags={tags}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          status: product.status === "TRASH" ? "DRAFT" : product.status,
          featured: product.featured,
          sku: product.sku ?? "",
          regularPrice: dec(product.regularPrice ?? (product.variants.length ? null : product.price)),
          salePrice: dec(product.salePrice),
          manageStock: product.manageStock,
          stockQuantity: product.stockQuantity?.toString() ?? "",
          stockStatus: product.stockStatus,
          weight: dec(product.weight),
          metaTitle: product.metaTitle ?? "",
          metaDescription: product.metaDescription ?? "",
          primaryImageUrl: product.primaryImageUrl,
          galleryImageUrls: product.galleryImageUrls,
          categoryIds: product.categories.map((c) => c.id),
          tagIds: product.tags.map((t) => t.id),
          attributes: product.attributes.map((a) => ({ key: `a${a.id}`, id: a.id, name: a.name, options: a.options, isVariation: a.isVariation, isVisible: a.isVisible })),
          variants: product.variants.map((v) => {
            const raw = v.attributes && typeof v.attributes === "object" && !Array.isArray(v.attributes) ? (v.attributes as Record<string, string>) : {};
            return {
              key: `v${v.id}`,
              id: v.id,
              attributes: Object.fromEntries(Object.entries(raw).map(([slug, val]) => [keyOf.get(slug) ?? slug, val])),
              sku: v.sku ?? "",
              regularPrice: dec(v.regularPrice ?? v.price),
              salePrice: dec(v.salePrice),
              manageStock: v.manageStock,
              stockQuantity: v.stockQuantity?.toString() ?? "",
              stockStatus: v.stockStatus,
              enabled: v.enabled,
              imageUrl: v.imageUrl,
            };
          }),
        }}
      />
    </div>
  );
}
