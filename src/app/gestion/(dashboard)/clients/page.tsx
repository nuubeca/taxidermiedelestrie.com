import type { Prisma } from "@prisma/client";
import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/gestion/format";
import { Badge, ButtonLink, EmptyState, FilterTabs, PageHeader, Pagination, RowLink, SearchBar, Table, Td, Th, rowClass } from "@/components/gestion/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface SearchParams { q?: string; page?: string; role?: string }

export default async function ClientsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const role = sp.role === "ADMIN" ? "ADMIN" : undefined;

  const where: Prisma.ProfileWhereInput = {
    ...(role ? { role } : {}),
    ...(q
      ? { OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ] }
      : {}),
  };

  const [total, all, admins, profiles] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.count(),
    prisma.profile.count({ where: { role: "ADMIN" } }),
    prisma.profile.findMany({
      where,
      orderBy: [{ orders: { _count: "desc" } }, { lastName: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { _count: { select: { orders: true } }, orders: { orderBy: { placedAt: "desc" }, take: 1, select: { placedAt: true } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => Boolean(e[1]))).toString();
    return `/gestion/clients${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Comptes clients du site. Les clients se connectent avec un code reçu par courriel."
        actions={<ButtonLink href="/gestion/clients/nouveau" icon={Plus}>Nouveau client</ButtonLink>}
      />
      <FilterTabs
        items={[
          { href: href({ q }), label: "Tous", count: all, current: !role },
          { href: href({ q, role: "ADMIN" }), label: "Administrateurs", count: admins, current: role === "ADMIN" },
        ]}
      />
      <SearchBar action="/gestion/clients" placeholder="Nom, courriel, entreprise ou téléphone" defaultValue={q}>
        {role ? <input type="hidden" name="role" value={role} /> : null}
      </SearchBar>

      {profiles.length === 0 ? (
        <EmptyState icon={Users} title="Aucun client" description={q ? "Aucun résultat pour cette recherche." : undefined} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Client</Th>
              <Th className="hidden md:table-cell">Téléphone</Th>
              <Th className="hidden lg:table-cell">Dernière commande</Th>
              <Th className="text-right">Commandes</Th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
              return (
                <tr key={p.id} className={rowClass}>
                  <Td>
                    <RowLink href={`/gestion/clients/${p.id}`} label={`Ouvrir la fiche de ${name || p.email}`}>
                      <span className="flex items-center gap-2 font-medium text-ink">
                        {name || p.email}
                        {p.role === "ADMIN" ? <Badge tone="info">Admin</Badge> : null}
                      </span>
                    </RowLink>
                    <span className="block text-xs text-ink-muted">{[name ? p.email : null, p.company].filter(Boolean).join(" · ") || " "}</span>
                  </Td>
                  <Td className="hidden text-ink-muted md:table-cell">{p.phone ?? "—"}</Td>
                  <Td className="hidden text-ink-muted lg:table-cell">{p.orders[0] ? shortDate(p.orders[0].placedAt) : "—"}</Td>
                  <Td className="text-right font-mono tabular-nums text-ink">{p._count.orders}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => href({ q, role, page: String(n) })} />
    </div>
  );
}
