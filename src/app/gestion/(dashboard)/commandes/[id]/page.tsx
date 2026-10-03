import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Pencil, Phone, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { asAddress, formatAddressLines, FULFILLMENT_LABEL } from "@/lib/orders/format";
import { dateTime, money } from "@/lib/gestion/format";
import { OrderStatusBadge } from "@/components/gestion/badges";
import { ButtonLink, PageHeader, Panel } from "@/components/gestion/ui";
import { ConfirmButton } from "@/components/gestion/forms";
import { deleteOrder } from "../actions";
import { NoteForm, StatusStepper } from "./OrderActions";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { id: "asc" } }, notes: { orderBy: { createdAt: "desc" } }, profile: { select: { id: true } } },
  });
  if (!order) notFound();

  const billing = formatAddressLines(asAddress(order.billing));
  const shipping = formatAddressLines(asAddress(order.shipping));
  const name = [order.firstName, order.lastName].filter(Boolean).join(" ");
  const units = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div>
      <PageHeader
        back={{ href: "/gestion/commandes", label: "Commandes" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>Commande <span className="font-mono">{order.number}</span></span>
            <OrderStatusBadge status={order.status} />
          </span>
        }
        description={`Passée le ${dateTime(order.placedAt)}`}
        actions={
          <>
            <ButtonLink href={`/gestion/commandes/${order.id}/modifier`} variant="secondary" icon={Pencil}>Modifier</ButtonLink>
            {order.status === "CANCELLED" ? (
              <ConfirmButton onConfirm={deleteOrder.bind(null, order.id)} label="Supprimer" confirmLabel="Supprimer définitivement" />
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Panel title="Progression">
            <StatusStepper orderId={order.id} status={order.status} />
          </Panel>

          <Panel title="Articles" description={`${order.items.length} ligne${order.items.length > 1 ? "s" : ""} · ${units} unité${units > 1 ? "s" : ""}`} bodyClassName="p-0">
            <ul className="divide-y divide-rule">
              {order.items.map((i) => {
                const attrs = i.attributes && typeof i.attributes === "object" && !Array.isArray(i.attributes) ? Object.values(i.attributes as Record<string, string>) : [];
                return (
                  <li key={i.id} className="flex items-start gap-4 px-5 py-3">
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-bg-alt px-2 font-mono text-sm tabular-nums text-ink">{i.quantity}×</span>
                    <div className="min-w-0 flex-1">
                      {i.productId ? (
                        <Link href={`/gestion/products/${i.productId}`} className="text-sm font-medium text-ink hover:underline">{i.name}</Link>
                      ) : (
                        <span className="text-sm font-medium text-ink">{i.name}</span>
                      )}
                      <p className="text-xs text-ink-muted">{[attrs.join(" · "), i.sku ? `SKU ${i.sku}` : null].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm tabular-nums text-ink">{money(i.lineTotal)}</p>
                      <p className="font-mono text-xs tabular-nums text-ink-muted">{money(i.unitPrice)} / u.</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between border-t border-rule px-5 py-4 text-sm">
              <span className="text-ink-muted">Sous-total avant taxes</span>
              <span className="font-mono font-medium tabular-nums text-ink">{money(order.subtotal)}</span>
            </div>
          </Panel>

          {order.customerNote ? (
            <Panel title="Note du client">
              <p className="whitespace-pre-line text-sm text-ink">{order.customerNote}</p>
            </Panel>
          ) : null}

          <Panel title="Historique et notes internes" className="print:hidden">
            <NoteForm orderId={order.id} />
            <ol className="mt-6 flex flex-col gap-4">
              {order.notes.map((n) => (
                <li key={n.id} className="relative border-l-2 border-rule pl-4">
                  <p className="whitespace-pre-line text-sm text-ink">{n.content}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {n.author === "system" ? "Système" : n.author} · {dateTime(n.createdAt)}
                    {n.isCustomerVisible ? " · visible par le client" : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="flex flex-col gap-6">
          <Panel title="Client">
            <div className="flex flex-col gap-2 text-sm">
              <p className="flex items-center gap-2 font-medium text-ink"><User className="h-4 w-4 text-ink-muted" aria-hidden />{name || "—"}</p>
              {order.company ? <p className="pl-6 text-ink-muted">{order.company}</p> : null}
              <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-ink hover:underline"><Mail className="h-4 w-4 text-ink-muted" aria-hidden />{order.email}</a>
              {order.phone ? (
                <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-ink hover:underline"><Phone className="h-4 w-4 text-ink-muted" aria-hidden />{order.phone}</a>
              ) : null}
              {order.profile ? (
                <Link href={`/gestion/clients/${order.profile.id}`} className="mt-2 text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">Voir la fiche client</Link>
              ) : (
                <p className="mt-2 text-xs text-terracotta">Commande sans compte associé</p>
              )}
            </div>
          </Panel>
          <Panel title="Réception">
            <p className="text-sm font-medium text-ink">{order.shippingLabel ?? FULFILLMENT_LABEL[order.fulfillment]}</p>
            {shipping.map((l) => <p key={l} className="text-sm text-ink-muted">{l}</p>)}
          </Panel>
          {billing.length ? (
            <Panel title="Facturation">
              {billing.map((l) => <p key={l} className="text-sm text-ink-muted">{l}</p>)}
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
