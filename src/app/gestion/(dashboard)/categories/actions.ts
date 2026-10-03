"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/gestion/action-result";
import { slugify, str } from "@/lib/gestion/format";

const CategorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(120),
  slug: z.string().trim().max(120),
  description: z.string().trim().max(5000),
  parentId: z.number().int().positive().nullable(),
  imageUrl: z.string().url().nullable(),
  position: z.number().int().min(0).max(9999),
});

function read(fd: FormData) {
  return CategorySchema.safeParse({
    name: str(fd, "name"),
    slug: str(fd, "slug"),
    description: str(fd, "description"),
    parentId: Number(str(fd, "parentId")) || null,
    imageUrl: str(fd, "imageUrl") || null,
    position: Number(str(fd, "position")) || 0,
  });
}

async function uniqueSlug(base: string, excludeId?: number) {
  const root = slugify(base) || "categorie";
  let candidate = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit || hit.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
}

/** Vrai si `candidateParent` est la catégorie elle-même ou l'une de ses descendantes. */
async function wouldCycle(id: number, candidateParent: number | null) {
  let cursor = candidateParent;
  while (cursor !== null) {
    if (cursor === id) return true;
    const row: { parentId: number | null } | null = await prisma.category.findUnique({ where: { id: cursor }, select: { parentId: true } });
    cursor = row?.parentId ?? null;
  }
  return false;
}

function revalidateCategories(id?: number) {
  revalidatePath("/gestion/categories");
  if (id) revalidatePath(`/gestion/categories/${id}`);
  revalidatePath("/catalogue", "layout");
}

export async function createCategory(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = read(fd);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const d = parsed.data;
  const slug = await uniqueSlug(d.slug || d.name);
  await prisma.category.create({
    data: { name: d.name, slug, description: d.description || null, parentId: d.parentId, imageUrl: d.imageUrl, position: d.position },
  });
  revalidateCategories();
  redirect("/gestion/categories");
}

export async function updateCategory(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return fail("Catégorie invalide.");
  const parsed = read(fd);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const d = parsed.data;
  if (await wouldCycle(id, d.parentId)) return fail("Une catégorie ne peut pas être placée sous elle-même ou sous une de ses sous-catégories.");

  const slug = await uniqueSlug(d.slug || d.name, id);
  await prisma.category.update({
    where: { id },
    data: { name: d.name, slug, description: d.description || null, parentId: d.parentId, imageUrl: d.imageUrl, position: d.position },
  });
  revalidateCategories(id);
  return ok();
}

/** Supprime la catégorie : ses sous-catégories remontent d'un niveau, les produits sont simplement détachés. */
export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  const cat = await prisma.category.findUnique({ where: { id }, select: { parentId: true } });
  if (!cat) return fail("Catégorie introuvable.");
  await prisma.$transaction([
    prisma.category.updateMany({ where: { parentId: id }, data: { parentId: cat.parentId } }),
    prisma.category.delete({ where: { id } }),
  ]);
  revalidateCategories();
  redirect("/gestion/categories");
}
