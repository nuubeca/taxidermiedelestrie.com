import type { Prisma, OrderStatus } from "@prisma/client";
import { Plus, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL, FULFILLMENT_LABEL } from "@/lib/orders/format";
import { money, shortDate } from "@/lib/gestion/format";
import { OrderStatusBadge } from "@/components/gestion/badges";
import {
  ButtonLink, EmptyState, FilterTabs, PageHeader, Pagination, RowLink, SearchBar, Table, Td, Th, rowClass,
} from "@/components/gestion/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES: OrderStatus[] = ["RECEIVED", "PROCESSING", "COMPLETED", "CANCELLED"];

interface SearchParams { q?: string; status?: string; page?: string }

export default async function OrdersList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const status = sp.status === "open" ? "open" : STATUSES.find((s) => s === sp.status);

  const where: Prisma.OrderWhereInput = {};
  if (status === "open") where.status = { in: ["RECEIVED", "PROCESSING"] };
  else if (status) where.status = status;
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const [total, orders, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const all = counts.reduce((n, c) => n + c._count._all, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (params: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    const s = qs.toString();
    return `/gestion/commandes${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Commandes"
        description="Les commandes du site arrivent ici. Le commis prépare, communique avec le client, puis complète."
        actions={<ButtonLink href="/gestion/commandes/nouvelle" icon={Plus}>Nouvelle commande</ButtonLink>}
      />

      <FilterTabs
        items={[
          { href: href({ q }), label: "Toutes", count: all, current: !status },
          { href: href({ q, status: "open" }), label: "À traiter", count: countOf("RECEIVED") + countOf("PROCESSING"), current: status === "open" },
          ...STATUSES.map((s) => ({ href: href({ q, status: s }), label: ORDER_STATUS_LABEL[s], count: countOf(s), current: status === s })),
        ]}
      />

      <SearchBar action="/gestion/commandes" placeholder="Numéro, nom, courriel ou téléphone" defaultValue={q}>
        {status ? <input type="hidden" name="status" value={status} /> : null}
      </SearchBar>

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Aucune commande" description={q ? "Aucun résultat pour cette recherche." : "Aucune commande dans cette vue."} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Commande</Th>
              <Th>Client</Th>
              <Th className="hidden md:table-cell">Réception</Th>
              <Th className="hidden sm:table-cell text-right">Articles</Th>
              <Th>Statut</Th>
              <Th className="text-right">Sous-total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const name = [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email;
              return (
                <tr key={o.id} className={rowClass}>
                  <Td>
                    <RowLink href={`/gestion/commandes/${o.id}`} label={`Ouvrir la commande ${o.number}`}>
                      <span className="font-mono text-sm font-medium text-ink">{o.number}</span>
                    </RowLink>
                    <span className="block text-xs text-ink-muted">{shortDate(o.placedAt)}</span>
                  </Td>
                  <Td>
                    <span className="block text-ink">{name}</span>
                    <span className="block max-w-[220px] truncate text-xs text-ink-muted">{o.email}</span>
                  </Td>
                  <Td className="hidden text-ink-muted md:table-cell">{FULFILLMENT_LABEL[o.fulfillment]}</Td>
                  <Td className="hidden text-right font-mono tabular-nums text-ink-muted sm:table-cell">{o._count.items}</Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td className="text-right font-mono tabular-nums text-ink">{money(o.subtotal)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Pagination page={page} pages={pages} hrefFor={(p) => href({ q, status, page: String(p) })} />
    </div>
  );
}
