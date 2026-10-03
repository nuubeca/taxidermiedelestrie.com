import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { asAddress } from "@/lib/orders/format";
import { PageHeader } from "@/components/gestion/ui";
import { updateOrder } from "../../actions";
import { OrderForm } from "../../OrderForm";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { orderBy: { id: "asc" } } } });
  if (!order) notFound();
  const ship = asAddress(order.shipping);

  return (
    <div>
      <PageHeader
        back={{ href: `/gestion/commandes/${order.id}`, label: `Commande ${order.number}` }}
        title="Modifier la commande"
        description="Les changements sont inscrits dans l'historique de la commande."
      />
      <OrderForm
        action={updateOrder}
        submitLabel="Enregistrer les changements"
        initial={{
          orderId: order.id,
          email: order.email,
          firstName: order.firstName ?? "",
          lastName: order.lastName ?? "",
          company: order.company ?? "",
          phone: order.phone ?? "",
          fulfillment: order.fulfillment,
          address1: ship?.address1 ?? "",
          address2: ship?.address2 ?? "",
          city: ship?.city ?? "",
          state: ship?.state ?? "QC",
          postcode: ship?.postcode ?? "",
          customerNote: order.customerNote ?? "",
          lines: order.items.map((i) => {
            const attrs = i.attributes && typeof i.attributes === "object" && !Array.isArray(i.attributes) ? (i.attributes as Record<string, string>) : null;
            return {
              key: `item-${i.id}`,
              productId: i.productId,
              variantId: i.variantId,
              name: i.name,
              detail: attrs ? Object.values(attrs).join(" · ") : null,
              sku: i.sku,
              attributes: attrs,
              quantity: i.quantity,
              unitPrice: i.unitPrice.toNumber(),
            };
          }),
        }}
      />
    </div>
  );
}
