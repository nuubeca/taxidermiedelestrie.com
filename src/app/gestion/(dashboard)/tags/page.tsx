import type { Prisma } from "@prisma/client";
import { Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ActionForm, SubmitButton, Feedback } from "@/components/gestion/forms";
import { EmptyState, PageHeader, Pagination, Panel, SearchBar, inputClass } from "@/components/gestion/ui";
import { createTag } from "./actions";
import { TagRow } from "./TagRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.TagWhereInput = q ? { name: { contains: q, mode: "insensitive" } } : {};
  const [total, tags] = await Promise.all([
    prisma.tag.count({ where }),
    prisma.tag.findMany({ where, orderBy: [{ productCount: "desc" }, { name: "asc" }], take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Étiquettes" description="Mots-clés libres associés aux produits, utiles pour la recherche." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchBar action="/gestion/tags" placeholder="Chercher une étiquette" defaultValue={q} />
          {tags.length === 0 ? (
            <EmptyState icon={Tags} title="Aucune étiquette" />
          ) : (
            <ul className="divide-y divide-rule rounded-xl border border-rule bg-surface">
              {tags.map((t) => <TagRow key={t.id} id={t.id} name={t.name} slug={t.slug} count={t.productCount} />)}
            </ul>
          )}
          <Pagination page={page} pages={pages} hrefFor={(n) => `/gestion/tags?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`} />
        </div>
        <Panel title="Nouvelle étiquette" className="self-start">
          <ActionForm
            action={createTag}
            resetOnSuccess
            className="flex flex-col gap-3"
            submitLabel="Ajouter" successMessage="Étiquette ajoutée." pendingLabel="Ajout…"
          >
            <label htmlFor="tag-name" className="text-sm font-medium text-ink">Nom</label>
            <input id="tag-name" name="name" required className={inputClass} />
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
