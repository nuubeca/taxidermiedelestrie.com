import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleDollarSign, Inbox, Package, PackageX, Plus, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money, shortDate } from "@/lib/gestion/format";
import { OrderStatusBadge } from "@/components/gestion/badges";
import { ButtonLink, EmptyState, PageHeader, Panel, StatCard } from "@/components/gestion/ui";

export const dynamic = "force-dynamic";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function Dashboard() {
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [received, processing, monthOrders, sales30, outOfStock, drafts, openOrders, recentOrders, stockAlerts] = await Promise.all([
    prisma.order.count({ where: { status: "RECEIVED" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { placedAt: { gte: startOfMonth() }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ where: { placedAt: { gte: since30 }, status: { not: "CANCELLED" } }, _sum: { subtotal: true }, _count: true }),
    prisma.product.count({ where: { status: "PUBLISHED", stockStatus: "outofstock" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.order.findMany({
      where: { status: { in: ["RECEIVED", "PROCESSING"] } },
      orderBy: { placedAt: "asc" },
      take: 8,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.findMany({ where: { status: { in: ["COMPLETED", "CANCELLED"] } }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", OR: [{ stockStatus: "outofstock" }, { manageStock: true, stockQuantity: { lte: 2 } }] },
      orderBy: [{ totalSales: "desc" }],
      take: 6,
      select: { id: true, name: true, primaryImageUrl: true, stockStatus: true, stockQuantity: true, manageStock: true },
    }),
  ]);

  const today = new Date().toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={<span className="first-letter:uppercase">{today}</span>}
        actions={
          <>
            <ButtonLink href="/gestion/products/nouveau" variant="secondary" icon={Package}>Nouveau produit</ButtonLink>
            <ButtonLink href="/gestion/commandes/nouvelle" icon={Plus}>Nouvelle commande</ButtonLink>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Nouvelles" value={received} hint="Commandes reçues à traiter" icon={Inbox} href="/gestion/commandes?status=RECEIVED" tone={received > 0 ? "attention" : "default"} />
        <StatCard label="En traitement" value={processing} hint="Client contacté, en préparation" icon={ShoppingBag} href="/gestion/commandes?status=PROCESSING" />
        <StatCard label="30 derniers jours" value={money(sales30._sum.subtotal ?? 0)} hint={`${sales30._count} commande${sales30._count > 1 ? "s" : ""} · ${monthOrders} ce mois-ci`} icon={CircleDollarSign} />
        <StatCard label="En rupture" value={outOfStock} hint={`${drafts} brouillon${drafts > 1 ? "s" : ""} non publié${drafts > 1 ? "s" : ""}`} icon={PackageX} href="/gestion/products?stock=outofstock" tone={outOfStock > 0 ? "attention" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          title="À préparer"
          description="Les plus anciennes en premier"
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={<Link href="/gestion/commandes?status=open" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">Tout voir <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
        >
          {openOrders.length === 0 ? (
            <div className="p-5"><EmptyState icon={Inbox} title="Rien à préparer" description="Toutes les commandes sont traitées." /></div>
          ) : (
            <ul className="divide-y divide-rule">
              {openOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/gestion/commandes/${o.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-bg-alt/70">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-medium text-ink">{o.number}</span>
                        <span className="truncate text-ink">{[o.firstName, o.lastName].filter(Boolean).join(" ") || o.email}</span>
                      </p>
                      <p className="text-xs text-ink-muted">{shortDate(o.placedAt)} · {o._count.items} article{o._count.items > 1 ? "s" : ""}{o.phone ? ` · ${o.phone}` : ""}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <span className="hidden w-24 text-right font-mono text-sm tabular-nums text-ink sm:block">{money(o.subtotal)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title="Stock à surveiller"
            bodyClassName="p-0"
            actions={<Link href="/gestion/products?stock=outofstock" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">Tout voir <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          >
            {stockAlerts.length === 0 ? (
              <p className="p-5 text-sm text-ink-muted">Aucune alerte de stock.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {stockAlerts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/gestion/products/${p.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-bg-alt/70">
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-bg-alt">
                        {p.primaryImageUrl ? <Image src={p.primaryImageUrl} alt="" fill sizes="36px" className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-ochre">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        {p.stockStatus === "outofstock" ? "Rupture" : `${p.stockQuantity ?? 0} restant`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Récemment terminées" bodyClassName="p-0">
            {recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-ink-muted">Aucune.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {recentOrders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/gestion/commandes/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-bg-alt/70">
                      <span className="font-mono text-ink">{o.number}</span>
                      <OrderStatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
