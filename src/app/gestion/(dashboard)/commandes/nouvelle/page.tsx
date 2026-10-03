import { prisma } from "@/lib/prisma";
import { asAddress } from "@/lib/orders/format";
import { PageHeader } from "@/components/gestion/ui";
import { createOrder } from "../actions";
import { OrderForm } from "../OrderForm";

export const dynamic = "force-dynamic";

/** `?client=<profileId>` pré-remplit le client (depuis sa fiche). */
export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const profile = client ? await prisma.profile.findUnique({ where: { id: client } }).catch(() => null) : null;
  const ship = asAddress(profile?.shipping);

  return (
    <div>
      <PageHeader
        back={{ href: "/gestion/commandes", label: "Commandes" }}
        title="Nouvelle commande"
        description="Pour une commande reçue au téléphone ou en boutique."
      />
      <OrderForm
        action={createOrder}
        submitLabel="Créer la commande"
        showStatus
        initial={{
          email: profile?.email ?? "",
          firstName: profile?.firstName ?? "",
          lastName: profile?.lastName ?? "",
          company: profile?.company ?? "",
          phone: profile?.phone ?? "",
          fulfillment: "PICKUP",
          address1: ship?.address1 ?? "",
          address2: ship?.address2 ?? "",
          city: ship?.city ?? "",
          state: ship?.state ?? "QC",
          postcode: ship?.postcode ?? "",
          customerNote: "",
          lines: [],
        }}
      />
    </div>
  );
}
