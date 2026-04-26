import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CategoryNode {
  id: number;
  wpTermId: number;
  slug: string;
  name: string;
  productCount: number;
  imageUrl: string | null;
  parentId: number | null;
  children: CategoryNode[];
}

function buildTree(rows: Omit<CategoryNode, "children">[]): CategoryNode[] {
  const byId = new Map<number, CategoryNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function Tree({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? "" : "ml-6 border-l border-gray-800 pl-4"}>
      {nodes.map((n) => (
        <li key={n.id} className="py-2">
          <div className="flex items-center gap-3">
            {n.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-800" />
            ) : (
              <div className="w-8 h-8 rounded bg-gray-900 border border-gray-800" />
            )}
            <div className="flex-1">
              <div className="text-sm">{n.name}</div>
              <div className="text-xs text-gray-500"><code>{n.slug}</code> · {n.productCount} produit{n.productCount > 1 ? "s" : ""}</div>
            </div>
          </div>
          {n.children.length > 0 && <Tree nodes={n.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export default async function CategoriesPage() {
  const rows = await prisma.category.findMany({
    select: { id: true, wpTermId: true, slug: true, name: true, productCount: true, imageUrl: true, parentId: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const tree = buildTree(rows);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Catégories</h1>
        <span className="text-sm text-gray-500">{rows.length} au total</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune catégorie. Lancez la migration.</p>
      ) : (
        <Tree nodes={tree} />
      )}
    </div>
  );
}
