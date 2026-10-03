import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { signOut } from "@/app/(public)/connexion/actions";
import { ORDER_STATUS_LABEL } from "@/lib/orders/format";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/mon-compte");
  const orders = await prisma.order.findMany({
    where: { profileId: user.id },
    orderBy: { placedAt: "desc" },
    take: 20,
    include: { _count: { select: { items: true } } },
  });

  return (
    <Section spacing="xl">
      <Container size="wide">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <Caption className="block mb-4">Espace client</Caption>
            <Heading level="h1" as="h1">Mon compte</Heading>
            <p className="mt-4 text-ink-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-6">
            {user.profile.role === "ADMIN" ? (
              <Link href="/gestion" className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink">
                Gestion
              </Link>
            ) : null}
            <form action={signOut}>
              <button type="submit" className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>

        <Heading level="h3" as="h2" className="mb-6">Mes commandes</Heading>
        {orders.length === 0 ? (
          <p className="text-ink-muted">
            Aucune commande pour l'instant.{" "}
            <Link href="/catalogue" className="link-naturalist text-ink">Parcourir le catalogue</Link>
          </p>
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/mon-compte/commandes/${o.number}`} className="grid grid-cols-2 gap-4 py-5 md:grid-cols-5 hover:bg-bg-alt transition-colors">
                  <span className="font-mono text-sm">{o.number}</span>
                  <span className="text-sm text-ink-muted">{o.placedAt.toLocaleDateString("fr-CA")}</span>
                  <span className="text-sm text-ink-muted">{o._count.items} article{o._count.items > 1 ? "s" : ""}</span>
                  <span className="text-sm">{ORDER_STATUS_LABEL[o.status]}</span>
                  <span className="text-sm text-right font-mono">{formatPrice(o.subtotal.toNumber())}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
