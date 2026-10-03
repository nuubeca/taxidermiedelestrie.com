import "server-only";
import { prisma } from "@/lib/prisma";

export type CategoryRow = { id: number; name: string; parentId: number | null; position: number };

/** Catégories aplaties dans l'ordre de l'arbre, avec leur profondeur. */
export function flattenTree<T extends CategoryRow>(rows: T[]): (T & { depth: number })[] {
  const children = new Map<number | null, T[]>();
  const ids = new Set(rows.map((r) => r.id));
  for (const r of rows) {
    const parent = r.parentId !== null && ids.has(r.parentId) ? r.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), r]);
  }
  for (const list of children.values()) list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"));
  const out: (T & { depth: number })[] = [];
  const walk = (parent: number | null, depth: number) => {
    for (const r of children.get(parent) ?? []) {
      out.push({ ...r, depth });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export async function categoryOptions() {
  const rows = await prisma.category.findMany({ select: { id: true, name: true, parentId: true, position: true } });
  return flattenTree(rows).map(({ id, name, depth }) => ({ id, name, depth }));
}

export async function tagOptions() {
  return prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
