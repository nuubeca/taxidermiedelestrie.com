import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { categoryOptions } from "@/lib/gestion/catalog";
import { ConfirmButton } from "@/components/gestion/forms";
import { ButtonLink, PageHeader, buttonClass } from "@/components/gestion/ui";
import { deleteCategory, updateCategory } from "../actions";
import { CategoryForm } from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) notFound();
  const [category, all, children] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId } }),
    categoryOptions(),
    prisma.category.count({ where: { parentId: categoryId } }),
  ]);
  if (!category) notFound();

  // Exclut la catégorie et ses descendantes des parents possibles.
  const idx = all.findIndex((c) => c.id === categoryId);
  const excluded = new Set<number>([categoryId]);
  for (let i = idx + 1; i < all.length && all[i].depth > all[idx].depth; i++) excluded.add(all[i].id);
  const parents = all.filter((c) => !excluded.has(c.id));

  return (
    <div>
      <PageHeader
        back={{ href: "/gestion/categories", label: "Catégories" }}
        title={category.name}
        description={`${category.productCount} produit${category.productCount > 1 ? "s" : ""} publié${category.productCount > 1 ? "s" : ""}${children ? ` · ${children} sous-catégorie${children > 1 ? "s" : ""}` : ""}`}
        actions={
          <>
            <ButtonLink href={`/gestion/products?categorie=${category.id}`} variant="secondary">Voir les produits</ButtonLink>
            <Link href={`/catalogue/${category.slug}`} target="_blank" className={buttonClass.secondary}>
              <ExternalLink className="h-4 w-4" aria-hidden /> Sur le site
            </Link>
            <ConfirmButton
              onConfirm={deleteCategory.bind(null, category.id)}
              confirmLabel="Supprimer la catégorie"
              description={children ? "Les sous-catégories remonteront d'un niveau." : "Les produits ne sont pas supprimés."}
            />
          </>
        }
      />
      <CategoryForm
        action={updateCategory}
        submitLabel="Enregistrer"
        parents={parents}
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          parentId: category.parentId,
          imageUrl: category.imageUrl,
          position: category.position,
        }}
      />
    </div>
  );
}
