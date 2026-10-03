import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";
import { ReorderButton } from "@/components/cart/ReorderButton";
import { formatPrice } from "@/lib/utils";
import { asAddress, formatAddressLines, FULFILLMENT_LABEL, ORDER_STATUS_LABEL } from "@/lib/orders/format";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

type Params = Promise<{ number: string }>;
type Search = Promise<{ merci?: string }>;

export default async function OrderPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { number } = await params;
  const { merci } = await searchParams;
  const user = await requireUser(`/mon-compte/commandes/${number}`);

  const order = await prisma.order.findFirst({
    where: { number, profileId: user.id },
    include: { items: true, notes: { where: { isCustomerVisible: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  // Produits encore au catalogue : permet de recommander.
  const productIds = order.items.map((i) => i.productId).filter((id): id is number => id !== null);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "PUBLISHED" },
    include: { variants: true, categories: { select: { slug: true }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const reorderLines = order.items.flatMap((i) => {
    const p = i.productId ? byId.get(i.productId) : undefined;
    if (!p) return [];
    const v = i.variantId ? p.variants.find((x) => x.id === i.variantId && x.enabled) : null;
    if (i.variantId && !v) return [];
    const price = v?.price ?? p.price;
    return [{
      productId: p.id,
      variantId: v?.id ?? null,
      slug: p.slug,
      categorySlug: p.categories[0]?.slug ?? "tous",
      name: p.name,
      sku: v?.sku ?? p.sku,
      imageUrl: p.primaryImageUrl,
      attributes: v ? (v.attributes as Record<string, string>) : {},
      unitPrice: price ? price.toNumber() : null,
      quantity: i.quantity,
    }];
  });

  const shipping = formatAddressLines(asAddress(order.shipping));

  return (
    <Section spacing="xl">
      <Container size="wide">
        {merci ? (
          <>
            <ClearCartOnMount />
            <div className="mb-10 flex items-center gap-3 border border-moss bg-moss/10 p-4" role="status">
              <Check className="h-4 w-4 text-moss" strokeWidth={2} />
              <Caption tone="strong" className="text-moss">
                Commande envoyée. Un commis vous contactera pour confirmer les détails et le paiement.
              </Caption>
            </div>
          </>
        ) : null}

        <Link href="/mon-compte" className="mb-8 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Mes commandes
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <Caption className="block mb-4">{order.placedAt.toLocaleDateString("fr-CA", { dateStyle: "long" })} · {ORDER_STATUS_LABEL[order.status]}</Caption>
            <Heading level="h1" as="h1">Commande {order.number}</Heading>
          </div>
          <ReorderButton lines={reorderLines} />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ul className="divide-y divide-rule border-y border-rule">
              {order.items.map((i) => {
                const attrs = i.attributes && typeof i.attributes === "object" && !Array.isArray(i.attributes) ? Object.values(i.attributes as Record<string, string>) : [];
                return (
                  <li key={i.id} className="flex justify-between gap-6 py-5">
                    <div>
                      <p className="font-serif text-lg">{i.name}</p>
                      {attrs.length ? <p className="mt-1 font-mono text-xs text-ink-muted">{attrs.join(" · ")}</p> : null}
                      <p className="mt-1 font-mono text-xs text-ink-subtle">{i.quantity} × {formatPrice(i.unitPrice.toNumber())}</p>
                    </div>
                    <span className="font-mono text-sm whitespace-nowrap">{formatPrice(i.lineTotal.toNumber())}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex items-baseline justify-between">
              <span className="text-ink-muted">Sous-total (avant taxes)</span>
              <span className="font-serif text-2xl">{formatPrice(order.subtotal.toNumber())}</span>
            </div>

            {order.notes.length > 0 ? (
              <div className="mt-12">
                <Caption tone="strong" className="block mb-4">Messages de l'atelier</Caption>
                <ul className="flex flex-col gap-4">
                  {order.notes.map((n) => (
                    <li key={n.id} className="border-l-2 border-ochre pl-4">
                      <p className="text-sm">{n.content}</p>
                      <p className="mt-1 font-mono text-xs text-ink-subtle">{n.createdAt.toLocaleDateString("fr-CA")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <Caption tone="strong" className="block mb-2">Réception</Caption>
              <p className="text-sm">{order.shippingLabel ?? FULFILLMENT_LABEL[order.fulfillment]}</p>
              {shipping.length ? <p className="mt-2 text-sm text-ink-muted">{shipping.map((l) => <span key={l} className="block">{l}</span>)}</p> : null}
            </div>
            {order.customerNote ? (
              <div>
                <Caption tone="strong" className="block mb-2">Votre note</Caption>
                <p className="text-sm text-ink-muted">{order.customerNote}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </Section>
  );
}
