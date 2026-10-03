import Image from "next/image";
import { FolderTree, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { flattenTree } from "@/lib/gestion/catalog";
import { ButtonLink, EmptyState, PageHeader, RowLink, Table, Td, Th, rowClass } from "@/components/gestion/ui";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const rows = await prisma.category.findMany({
    select: { id: true, slug: true, name: true, parentId: true, position: true, imageUrl: true, productCount: true },
  });
  const tree = flattenTree(rows);

  return (
    <div>
      <PageHeader
        title="Catégories"
        description={`${rows.length} catégories · le nombre de produits compte les produits publiés`}
        actions={<ButtonLink href="/gestion/categories/nouvelle" icon={Plus}>Nouvelle catégorie</ButtonLink>}
      />
      {tree.length === 0 ? (
        <EmptyState icon={FolderTree} title="Aucune catégorie" action={<ButtonLink href="/gestion/categories/nouvelle" icon={Plus}>Nouvelle catégorie</ButtonLink>} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Catégorie</Th>
              <Th className="hidden sm:table-cell">Adresse</Th>
              <Th className="text-right">Produits</Th>
            </tr>
          </thead>
          <tbody>
            {tree.map((c) => (
              <tr key={c.id} className={rowClass}>
                <Td>
                  <div className="flex items-center gap-3" style={{ paddingLeft: c.depth * 28 }}>
                    {c.depth > 0 ? <span className="h-px w-3 bg-rule" aria-hidden /> : null}
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-rule bg-bg-alt">
                      {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" /> : <FolderTree className="m-3 h-4 w-4 text-ink-subtle" aria-hidden />}
                    </span>
                    <RowLink href={`/gestion/categories/${c.id}`} label={`Modifier ${c.name}`}>
                      <span className={c.depth === 0 ? "font-medium text-ink" : "text-ink"}>{c.name}</span>
                    </RowLink>
                  </div>
                </Td>
                <Td className="hidden font-mono text-xs text-ink-muted sm:table-cell">{c.slug}</Td>
                <Td className="text-right font-mono tabular-nums text-ink-muted">{c.productCount}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
