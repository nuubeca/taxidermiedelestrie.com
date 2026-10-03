"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/gestion/action-result";
import { slugify, str } from "@/lib/gestion/format";

const NameSchema = z.string().trim().min(1, "Le nom est requis.").max(120);

async function uniqueSlug(base: string, excludeId?: number) {
  const root = slugify(base) || "etiquette";
  let candidate = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.tag.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit || hit.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
}

export async function createTag(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = NameSchema.safeParse(str(fd, "name"));
  if (!name.success) return fail(name.error.issues[0]?.message ?? "Nom invalide.");
  const existing = await prisma.tag.findFirst({ where: { name: { equals: name.data, mode: "insensitive" } }, select: { id: true } });
  if (existing) return fail("Cette étiquette existe déjà.");
  await prisma.tag.create({ data: { name: name.data, slug: await uniqueSlug(name.data) } });
  revalidatePath("/gestion/tags");
  return ok();
}

export async function renameTag(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const name = NameSchema.safeParse(str(fd, "name"));
  if (!Number.isInteger(id) || !name.success) return fail("Nom invalide.");
  await prisma.tag.update({ where: { id }, data: { name: name.data, slug: await uniqueSlug(name.data, id) } });
  revalidatePath("/gestion/tags");
  return ok();
}

export async function deleteTag(id: number): Promise<ActionResult> {
  await requireAdmin();
  await prisma.tag.delete({ where: { id } }).catch(() => null);
  revalidatePath("/gestion/tags");
  return ok();
}
