import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: [{ productCount: "desc" }, { name: "asc" }],
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tags</h1>
        <span className="text-sm text-gray-500">{tags.length} au total</span>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun tag.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.id} className="rounded border border-gray-800 px-3 py-1 text-sm">
              {t.name}
              {t.productCount > 0 && <span className="ml-2 text-xs text-gray-500">{t.productCount}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
