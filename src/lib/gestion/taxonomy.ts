import "server-only";
import { prisma } from "@/lib/prisma";

/** Recalcule `productCount` (produits publiés) des catégories et étiquettes touchées. */
export async function recountTaxonomies(categoryIds: number[], tagIds: number[]) {
  const cats = [...new Set(categoryIds)];
  const tags = [...new Set(tagIds)];
  await Promise.all([
    ...cats.map(async (id) => {
      const productCount = await prisma.product.count({ where: { status: "PUBLISHED", categories: { some: { id } } } });
      await prisma.category.update({ where: { id }, data: { productCount } }).catch(() => undefined);
    }),
    ...tags.map(async (id) => {
      const productCount = await prisma.product.count({ where: { status: "PUBLISHED", tags: { some: { id } } } });
      await prisma.tag.update({ where: { id }, data: { productCount } }).catch(() => undefined);
    }),
  ]);
}
