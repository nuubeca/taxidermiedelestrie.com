import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { asAddress, formatAddressLines, FULFILLMENT_LABEL } from "@/lib/orders/format";
import { OrderControls } from "./OrderControls";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, notes: { orderBy: { createdAt: "desc" } }, profile: { select: { id: true, email: true } } },
  });
  if (!order) notFound();

  const billing = formatAddressLines(asAddress(order.billing));
  const shipping = formatAddressLines(asAddress(order.shipping));

  return (
    <div className="max-w-5xl">
      <Link href="/gestion/commandes" className="text-xs text-neutral-500 hover:text-neutral-300">← Commandes</Link>
      <div className="flex items-baseline justify-between mt-2 mb-8">
        <h1 className="text-2xl font-semibold">Commande <span className="font-mono">{order.number}</span></h1>
        <span className="text-sm text-neutral-500">{order.placedAt.toLocaleString("fr-CA", { dateStyle: "long", timeStyle: "short" })}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500 border-b border-neutral-800">
              <tr><th className="py-2">Article</th><th>SKU</th><th className="text-center">Qté</th><th className="text-right">Prix</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {order.items.map((i) => {
                const attrs = i.attributes && typeof i.attributes === "object" && !Array.isArray(i.attributes) ? Object.values(i.attributes as Record<string, string>) : [];
                return (
                  <tr key={i.id} className="border-b border-neutral-900">
                    <td className="py-2">
                      {i.productId ? <Link href={`/gestion/products/${i.productId}`} className="hover:underline">{i.name}</Link> : i.name}
                      {attrs.length ? <span className="block text-xs text-neutral-500">{attrs.join(" · ")}</span> : null}
                    </td>
                    <td className="font-mono text-xs text-neutral-500">{i.sku ?? "—"}</td>
                    <td className="text-center">{i.quantity}</td>
                    <td className="text-right font-mono">{i.unitPrice.toNumber().toFixed(2)}</td>
                    <td className="text-right font-mono">{i.lineTotal.toNumber().toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr><td colSpan={4} className="py-3 text-right text-neutral-500">Sous-total avant taxes</td><td className="py-3 text-right font-mono">{order.subtotal.toNumber().toFixed(2)} $</td></tr>
            </tfoot>
          </table>

          {order.customerNote ? (
            <div className="mt-6 border border-neutral-800 rounded p-4">
              <p className="text-xs text-neutral-500 mb-1">Note du client</p>
              <p className="text-sm">{order.customerNote}</p>
            </div>
          ) : null}

          <div className="mt-8">
            <OrderControls orderId={order.id} status={order.status} />
          </div>

          <h2 className="mt-10 mb-3 text-sm font-semibold text-neutral-400">Historique</h2>
          <ul className="flex flex-col gap-3">
            {order.notes.map((n) => (
              <li key={n.id} className="border-l-2 border-neutral-800 pl-3">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-neutral-500">{n.author} · {n.createdAt.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}{n.isCustomerVisible ? " · visible par le client" : ""}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="flex flex-col gap-6 text-sm">
          <div className="border border-neutral-800 rounded p-4">
            <p className="text-xs text-neutral-500 mb-2">Client</p>
            <p>{[order.firstName, order.lastName].filter(Boolean).join(" ") || "—"}</p>
            {order.company ? <p className="text-neutral-400">{order.company}</p> : null}
            <p><a href={`mailto:${order.email}`} className="hover:underline">{order.email}</a></p>
            {order.phone ? <p><a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a></p> : null}
            {!order.profile ? <p className="mt-2 text-xs text-amber-400">Commande sans compte associé</p> : null}
          </div>
          <div className="border border-neutral-800 rounded p-4">
            <p className="text-xs text-neutral-500 mb-2">Réception</p>
            <p>{order.shippingLabel ?? FULFILLMENT_LABEL[order.fulfillment]}</p>
            {shipping.map((l) => <p key={l} className="text-neutral-400">{l}</p>)}
          </div>
          {billing.length ? (
            <div className="border border-neutral-800 rounded p-4">
              <p className="text-xs text-neutral-500 mb-2">Facturation</p>
              {billing.map((l) => <p key={l} className="text-neutral-400">{l}</p>)}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
