import Link from "next/link";
import type { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL, FULFILLMENT_LABEL } from "@/lib/orders/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES: OrderStatus[] = ["RECEIVED", "PROCESSING", "COMPLETED", "CANCELLED"];

interface SearchParams { q?: string; status?: string; page?: string }

export default async function OrdersList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const status = STATUSES.find((s) => s === sp.status);

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { placedAt: "desc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, include: { _count: { select: { items: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Commandes <span className="text-neutral-500 text-base">({total})</span></h1>
      </div>

      <form className="flex flex-wrap gap-3 mb-6">
        <input name="q" defaultValue={q} placeholder="Numéro, nom, courriel, téléphone" className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm w-80" />
        <select name="status" defaultValue={status ?? ""} className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm">
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
        <button type="submit" className="bg-neutral-200 text-neutral-900 rounded px-4 py-2 text-sm">Filtrer</button>
      </form>

      <table className="w-full text-sm">
        <thead className="text-left text-neutral-500 border-b border-neutral-800">
          <tr><th className="py-2">Numéro</th><th>Date</th><th>Client</th><th>Réception</th><th>Articles</th><th>Statut</th><th className="text-right">Sous-total</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-neutral-900 hover:bg-neutral-900">
              <td className="py-2"><Link href={`/gestion/commandes/${o.id}`} className="font-mono text-neutral-100 hover:underline">{o.number}</Link></td>
              <td>{o.placedAt.toLocaleDateString("fr-CA")}</td>
              <td>{[o.firstName, o.lastName].filter(Boolean).join(" ") || "—"}<span className="block text-xs text-neutral-500">{o.email}</span></td>
              <td>{FULFILLMENT_LABEL[o.fulfillment]}</td>
              <td>{o._count.items}</td>
              <td>{ORDER_STATUS_LABEL[o.status]}</td>
              <td className="text-right font-mono">{o.subtotal.toNumber().toFixed(2)} $</td>
            </tr>
          ))}
          {orders.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-neutral-500">Aucune commande.</td></tr> : null}
        </tbody>
      </table>

      {pages > 1 ? (
        <div className="flex gap-2 mt-6 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={{ pathname: "/gestion/commandes", query: { ...(q ? { q } : {}), ...(status ? { status } : {}), page: p } }} className={p === page ? "px-3 py-1 bg-neutral-200 text-neutral-900 rounded" : "px-3 py-1 bg-neutral-900 rounded"}>{p}</Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
